package com.alumnect.alumnect_backend.security;

/**
 * Lớp hằng số tập trung toàn bộ danh sách URL của hệ thống.
 * Được sử dụng bởi {@link SecurityConfiguration} để cấu hình Spring Security:
 * - Các endpoint công khai không cần JWT (Swagger, đăng ký, đăng nhập, xác thực email).
 * - Các endpoint chỉ dành cho Admin.
 * Khi thêm endpoint mới, chỉ cần khai báo tại đây thay vì sửa trực tiếp vào SecurityConfiguration.
 */
public class Endpoints {

    // Swagger / OpenAPI — cho phép truy cập tài liệu API và trang giao diện Swagger UI
    // Thêm /error để Spring Boot trả đúng mã lỗi (404/400) thay vì trả 403 giả
    public static final String[] SWAGGER_ENDPOINTS = {
        "/api/v1/v3/api-docs",
        "/api/v1/v3/api-docs/**",
        "/swagger-ui.html",
        "/swagger-ui/**",
        "/swagger-resources/**",
        "/webjars/**",
        "/error"
    };

    // Endpoint công khai — GET, không cần đăng nhập
    public static final String[] PUBLIC_GET = {
        "/api/v1/majors",           // Lấy danh sách chuyên ngành (dùng lúc đăng ký)
        "/api/v1/auth/verify-email",    // Xác nhận email qua mã OTP (click link hoặc nhập mã)
        "/api/v1/auth/verify-email/**",
        "/api/v1/files/presigned-url", // Sinh link ký sẵn để tải file
        "/api/v1/questions",        // Xem danh sách câu hỏi diễn đàn Q&A (UC38 - Guest xem được)
        "/api/v1/questions/topics"  // Lấy danh mục chủ đề để lọc câu hỏi (UC38)
    };

    // Endpoint công khai — POST, không cần đăng nhập
    public static final String[] PUBLIC_POST = {
        "/api/v1/auth/register", // Đăng ký tài khoản mới
        "/api/v1/auth/login",    // Đăng nhập lấy JWT token
        "/api/v1/auth/google",   // Đăng nhập bằng Google OAuth2
        "/api/v1/auth/google/register", // Đăng ký bằng Google OAuth2
        "/api/v1/auth/resend-otp", // Gửi lại mã OTP xác thực
        "/api/v1/auth/refresh"   // Làm mới access token bằng refresh token
    };

    // Endpoint dành riêng cho Admin
    public static final String[] ADMIN_ENDPOINT = {
        "/api/v1/admin/**"
    };
}
