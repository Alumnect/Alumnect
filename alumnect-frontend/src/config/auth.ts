/** 
 * Cấu hình xác thực và bảo vệ route cho ứng dụng AlumNect.
 * Khi AUTH_ENFORCED = true, route guards yêu cầu đăng nhập và vai trò hợp lệ.
 */

/**
 * Luôn bật chế độ xác thực thực tế — bắt buộc đăng nhập qua API Spring Boot.
 * @deprecated Không còn dùng biến môi trường VITE_REQUIRE_AUTH nữa.
 */
export const AUTH_ENFORCED = true
