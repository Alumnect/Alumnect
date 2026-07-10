package com.alumnect.alumnect_backend.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu đổi mật khẩu của người dùng.
 * Áp dụng các luật kiểm tra dữ liệu đầu vào (Validation) bằng tiếng Việt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    /** Mật khẩu hiện tại của người dùng */
    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String oldPassword;

    /** Mật khẩu mới (yêu cầu độ dài 8-100 ký tự, chứa cả chữ cái và chữ số) */
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu mới phải có độ dài từ 8 đến 100 ký tự")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "Mật khẩu mới phải chứa ít nhất 1 chữ cái và 1 chữ số"
    )
    private String newPassword;

    /** Xác nhận lại mật khẩu mới */
    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    private String confirmNewPassword;
}
