package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResetOtpRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String email;

    @NotBlank(message = "Mã xác thực không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã xác thực phải có đúng 6 chữ số")
    private String token;
}
