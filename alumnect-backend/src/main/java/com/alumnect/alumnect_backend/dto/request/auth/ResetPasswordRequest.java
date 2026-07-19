package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu đặt lại mật khẩu mới.
 * Sử dụng để đón nhận email, mã OTP và mật khẩu mới từ Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    /** Địa chỉ email của tài khoản cần đổi mật khẩu */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;

    /** Mã OTP 6 chữ số nhận từ hòm thư người dùng */
    @NotBlank(message = "Mã xác thực không được để trống")
    @Size(min = 6, max = 6, message = "Mã xác thực phải đúng 6 chữ số")
    private String token;

    /** Mật khẩu mới muốn thay đổi */
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có độ dài từ 8 đến 100 ký tự")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số"
    )
    private String newPassword;
}
