package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu đăng nhập bằng Google.
 * Nhận token xác thực từ Frontend gửi lên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {

    /** Token ID nhận được từ Google Identity Services phía Client */
    @NotBlank(message = "Google ID token không được để trống")
    private String token;
}
