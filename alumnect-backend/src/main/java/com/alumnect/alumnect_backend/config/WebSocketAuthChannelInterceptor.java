package com.alumnect.alumnect_backend.config;

import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.security.jwt.JwtService;
import com.alumnect.alumnect_backend.security.principal.UserDetailServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Principal;

/**
 * Bộ đánh chặn (Channel Interceptor) kiểm tra và xác thực JWT token trong frame CONNECT của STOMP WebSocket.
 * Thiết lập đối tượng Principal là User ID để hỗ trợ định tuyến tin nhắn cá nhân qua /user/queue/messages.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailServiceImpl userDetailsService;
    private final UserRepository userRepository;

    /** Quyền của tài khoản Quản trị viên trong Spring Security. */
    private static final String ADMIN_AUTHORITY = "ROLE_ADMIN";

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Lấy header Authorization hoặc token từ STOMP CONNECT frame
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || authHeader.isBlank()) {
                authHeader = accessor.getFirstNativeHeader("token");
            }

            if (authHeader == null || authHeader.isBlank()) {
                log.warn("Từ chối kết nối WebSocket: Thiếu header xác thực");
                throw new MessageDeliveryException("Yêu cầu mã xác thực JWT trong kết nối WebSocket");
            }

            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            try {
                String username = jwtService.extractUsername(token);
                if (username == null) {
                    throw new MessageDeliveryException("Không thể trích xuất thông tin người dùng từ JWT token");
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (!jwtService.validateToken(token, userDetails)) {
                    throw new MessageDeliveryException("Mã xác thực JWT không hợp lệ hoặc đã hết hạn");
                }

                User user = userRepository.findByEmail(username).orElse(null);
                if (user == null) {
                    throw new MessageDeliveryException("Không tìm thấy người dùng tương ứng với token");
                }

                // Gán Principal với tên là User ID dạng chuỗi (dùng cho convertAndSendToUser)
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        user.getId().toString(),
                        null,
                        userDetails.getAuthorities()
                );
                accessor.setUser(auth);
                log.info("WebSocket kết nối thành công cho User ID: {}", user.getId());
            } catch (MessageDeliveryException mde) {
                log.warn("Từ chối kết nối WebSocket: {}", mde.getMessage());
                throw mde;
            } catch (Exception e) {
                log.error("Xác thực WebSocket token thất bại: {}", e.getMessage());
                throw new MessageDeliveryException("Mã xác thực WebSocket không hợp lệ hoặc đã hết hạn: " + e.getMessage());
            }
        }

        if (accessor != null) {
            assertAdminChannelAccess(accessor);
        }
        return message;
    }

    /**
     * Chặn tài khoản không phải ADMIN đăng ký nghe hoặc gửi tin vào kênh quản trị.
     * Broker đơn giản không tự phân quyền nên mọi tài khoản đăng nhập đều có thể nghe, thậm chí giả mạo cảnh báo.
     *
     * @param accessor Header của frame STOMP đang xử lý
     */
    private void assertAdminChannelAccess(StompHeaderAccessor accessor) {
        StompCommand command = accessor.getCommand();
        String destination = accessor.getDestination();
        boolean touchesChannel = StompCommand.SUBSCRIBE.equals(command) || StompCommand.SEND.equals(command);
        if (touchesChannel && destination != null && destination.startsWith(WebSocketDestinations.TOPIC_ADMIN_PREFIX)
                && !isAdmin(accessor.getUser())) {
            log.warn("Từ chối truy cập kênh quản trị {}: lệnh {}", destination, command);
            throw new MessageDeliveryException("Bạn không có quyền truy cập kênh quản trị");
        }
    }

    private boolean isAdmin(Principal principal) {
        return principal instanceof Authentication authentication
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> ADMIN_AUTHORITY.equals(authority.getAuthority()));
    }
}
