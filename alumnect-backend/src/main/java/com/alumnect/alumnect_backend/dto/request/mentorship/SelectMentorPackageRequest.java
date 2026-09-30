package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu yêu cầu lựa chọn gói dịch vụ Mentor (UC92).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectMentorPackageRequest {

    /** ID của gói dịch vụ Mentor được lựa chọn */
    @NotNull(message = "Mã gói dịch vụ không được để trống")
    private Long packageId;
}
