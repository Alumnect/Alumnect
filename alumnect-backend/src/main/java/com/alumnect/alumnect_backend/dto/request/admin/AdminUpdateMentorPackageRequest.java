package com.alumnect.alumnect_backend.dto.request.admin;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu cập nhật giá và trạng thái gói Mentor dành cho Admin (UC95).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateMentorPackageRequest {

    /** Giá gói mới (VND) - bắt buộc, không được âm */
    @NotNull(message = "Giá gói dịch vụ không được để trống")
    @DecimalMin(value = "0.00", message = "Giá gói dịch vụ phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    /** Trạng thái gói dịch vụ: ACTIVE hoặc INACTIVE */
    @NotNull(message = "Trạng thái gói dịch vụ không được để trống")
    private MentorPackageStatus status;

    /** Tên gói dịch vụ (tùy chọn) */
    private String name;

    /** Mô tả chi tiết quyền lợi (tùy chọn) */
    private String description;
}
