package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu làm mới Access Token.
 * Client gửi Refresh Token để Backend xác thực và cấp cặp token mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshRequest {

    /** Token refresh dùng để xác định phiên làm mới */
    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}
