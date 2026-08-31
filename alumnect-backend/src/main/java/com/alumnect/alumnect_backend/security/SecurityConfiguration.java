package com.alumnect.alumnect_backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import com.alumnect.alumnect_backend.security.filter.JwtFilter;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.alumnect.alumnect_backend.common.api.ApiResponse;
import java.util.Arrays;

/**
 * Cấu hình bảo mật hệ thống sử dụng Spring Security.
 * Thiết lập các quy tắc phân quyền đường dẫn, cấu hình CORS, JWT filter và mã hóa mật khẩu.
 */
@Configuration
public class SecurityConfiguration {

    @Autowired
    private JwtFilter jwtFilter;

    /**
     * Bean cung cấp thuật toán mã hóa mật khẩu BCrypt.
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Cấu hình nhà cung cấp xác thực (Authentication Provider) sử dụng DaoAuthenticationProvider.
     * Liên kết lớp UserDetailsService tự tùy chỉnh và thuật toán mã hóa mật khẩu.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService) {
        DaoAuthenticationProvider dap = new DaoAuthenticationProvider(userDetailsService);
        dap.setPasswordEncoder(passwordEncoder());
        return dap;
    }

    /**
     * Cấu hình chuỗi lọc bảo mật (Security Filter Chain) để áp dụng các luật bảo mật cho HTTP request.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(config -> config
                // Cho phép truy cập tự do các tài liệu Swagger/OpenAPI
                .requestMatchers(Endpoints.SWAGGER_ENDPOINTS).permitAll()
                // Cho phép các request GET công khai
                .requestMatchers(HttpMethod.GET, Endpoints.PUBLIC_GET).permitAll()
                // Cho phép các request POST công khai (register, login, google)
                .requestMatchers(HttpMethod.POST, Endpoints.PUBLIC_POST).permitAll()
                // Các endpoint bắt đầu bằng /api/v1/admin yêu cầu quyền ADMIN
                .requestMatchers(Endpoints.ADMIN_ENDPOINT).hasRole("ADMIN")
                // Endpoint thao tác bình luận bắt buộc JWT; kiểm tra role/ownership chi tiết ở Service.
                .requestMatchers(Endpoints.MEMBER_ENDPOINTS).authenticated()
                // Mọi request còn lại đều phải được xác thực bằng JWT
                .anyRequest().authenticated());

        // Cấu hình Exception Handling để trả về JSON chuẩn cho lỗi 401 và 403
        http.exceptionHandling(exception -> exception
                // Lỗi 401: Chưa xác thực (chưa đăng nhập hoặc token hết hạn/không hợp lệ)
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
                    response.setContentType("application/json;charset=UTF-8");
                    ApiResponse<Void> apiResponse = ApiResponse.error(401, "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");
                    response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
                    response.getWriter().flush();
                })
                // Lỗi 403: Đã xác thực nhưng thiếu quyền truy cập (ví dụ STUDENT truy cập ADMIN API)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403
                    response.setContentType("application/json;charset=UTF-8");
                    ApiResponse<Void> apiResponse = ApiResponse.error(403, "Bạn không có quyền thực hiện chức năng này.");
                    response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
                    response.getWriter().flush();
                })
        );

        // Cấu hình CORS - Cho phép tất cả các nguồn truy cập phục vụ chạy cục bộ/mobile
        http.cors(cors -> cors.configurationSource(request -> {
            CorsConfiguration corsConfig = new CorsConfiguration();
            corsConfig.addAllowedOrigin("*"); 
            corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
            corsConfig.addAllowedHeader("*");
            return corsConfig;
        }));

        // Sử dụng phiên làm việc không trạng thái (Stateless Session) vì dùng token JWT
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Thêm bộ lọc JWT (JwtFilter) trước bộ lọc xác thực mặc định của Spring
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        // Vô hiệu hóa CSRF vì hệ thống sử dụng Stateless API với token
        http.csrf(csrf -> csrf.disable());

        return http.build();
    }

    /**
     * Bean quản lý quá trình xác thực người dùng.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
