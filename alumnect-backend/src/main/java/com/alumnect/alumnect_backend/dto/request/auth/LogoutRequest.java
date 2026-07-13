package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO tiếp nhận thông tin yêu cầu đăng xuất từ Client.
 * Chứa Refresh Token để thực hiện thu hồi phiên làm việc trong DB.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogoutRequest {

    /** Refresh Token cần thu hồi */
    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}
