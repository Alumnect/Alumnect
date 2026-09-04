package com.alumnect.alumnect_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket với STOMP Message Broker phục vụ tính năng Nhắn tin thời gian thực (UC33)
 * và có thể tái sử dụng cho Thông báo (Notifications) trong toàn bộ nền tảng AlumNect.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket thuần và kèm hỗ trợ SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Tiền tố cho các kênh tin nhắn đẩy từ Server về Client (Pub/Sub)
        // /topic dùng cho kênh nhóm/công khai, /queue dùng cho kênh tin nhắn/thông báo cá nhân
        registry.enableSimpleBroker("/topic", "/queue");

        // Tiền tố cho các request gửi từ Client lên Server
        registry.setApplicationDestinationPrefixes("/app");

        // Tiền tố cho các kênh cá nhân của từng người dùng (/user/queue/messages, /user/queue/notifications)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Đăng ký bộ chặn xác thực token JWT khi Client kết nối
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
