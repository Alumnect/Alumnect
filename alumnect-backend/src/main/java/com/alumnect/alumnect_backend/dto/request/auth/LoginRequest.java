package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu đăng nhập local của người dùng.
 * Sử dụng để đón nhận thông tin email và mật khẩu từ Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /** Địa chỉ email của tài khoản đăng nhập */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;

    /** Mật khẩu của tài khoản */
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
