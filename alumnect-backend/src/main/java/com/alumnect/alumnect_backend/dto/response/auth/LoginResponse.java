package com.alumnect.alumnect_backend.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin phản hồi khi đăng nhập thành công.
 * Trả về token JWT và thông tin tài khoản cơ bản cho Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /** Access token JWT dùng để truy cập các API được bảo vệ */
    private String accessToken;

    /** Refresh token dùng để làm mới access token khi hết hạn */
    private String refreshToken;

    /** ID của người dùng đăng nhập thành công */
    private Long id;

    /** Địa chỉ email của tài khoản */
    private String email;

    /** Vai trò của người dùng (VD: STUDENT, ALUMNI, ADMIN) */
    private String role;

    /** Họ và tên của người dùng */
    private String fullName;

    /** Đường dẫn ảnh đại diện của người dùng */
    private String avatarUrl;

    /** Trạng thái hiện tại của tài khoản (VD: ACTIVE) */
    private String accountStatus;
}
