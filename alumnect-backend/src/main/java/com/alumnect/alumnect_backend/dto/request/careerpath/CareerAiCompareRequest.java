package com.alumnect.alumnect_backend.dto.request.careerpath;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu AI đối chiếu lộ trình 1-chạm [C2]: chỉ cần ID cựu sinh viên mục tiêu — hồ sơ người xem lấy từ JWT.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerAiCompareRequest {

    @NotNull(message = "Vui lòng chọn cựu sinh viên cần so sánh")
    private Long targetUserId;
}
