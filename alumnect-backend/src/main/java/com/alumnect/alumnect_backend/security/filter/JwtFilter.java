package com.alumnect.alumnect_backend.security.filter;

import com.alumnect.alumnect_backend.security.jwt.JwtService;
import com.alumnect.alumnect_backend.security.principal.UserDetailServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * Bộ lọc JWT (Filter) chặn mọi request gửi đến hệ thống để kiểm tra và xác thực JWT token.
 * Kế thừa OncePerRequestFilter để đảm bảo bộ lọc này chỉ thực thi một lần cho mỗi request.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailServiceImpl userDetailsService;

    /**
     * Phương thức thực hiện lọc request, trích xuất token, validate và thiết lập thông tin xác thực vào Security Context.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            // Lấy header Authorization từ request
            String authHeader = request.getHeader("Authorization");
            String token = null;
            String username = null;

            // Nếu header bắt đầu bằng "Bearer " thì tiến hành trích xuất token
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                username = jwtService.extractUsername(token);
            }

            // Nếu trích xuất được username và chưa được xác thực trong phiên làm việc hiện tại
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Kiểm tra tính hợp lệ của token (đúng user, chưa hết hạn)
                if (jwtService.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    // Thiết lập quyền và thông tin xác thực vào context của Spring Security
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Ghi nhận lỗi khi phân tích cú pháp hoặc xác thực JWT
            logger.error("Không thể thiết lập thông tin xác thực người dùng: {}", e);
        }

        // Tiếp tục chuỗi lọc (filter chain)
        filterChain.doFilter(request, response);
    }
}
