package com.alumnect.alumnect_backend.dto.request.salary;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO yêu cầu AI kiểm tra mức lương trước khi đóng góp (A1): cùng bộ trường với
 * {@link CreateSalaryContributionRequest} nhưng chỉ dùng để kiểm tra, KHÔNG lưu dữ liệu.
 * Mức lương luôn hiểu là VNĐ gộp (Gross) hàng tháng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryAiCheckRequest {

    /** ID ngành nghề (tùy chọn). */
    private Long industryId;

    @NotBlank(message = "Chức danh công việc không được để trống")
    @Size(max = 150, message = "Chức danh công việc không được vượt quá 150 ký tự")
    private String jobTitle;

    @Size(max = 150, message = "Tên công ty không được vượt quá 150 ký tự")
    private String company;

    @Size(max = 120, message = "Khu vực làm việc không được vượt quá 120 ký tự")
    private String region;

    @Size(max = 120, message = "Thành phố không được vượt quá 120 ký tự")
    private String locationCity;

    @Min(value = 0, message = "Số năm kinh nghiệm không được âm")
    @Max(value = 60, message = "Số năm kinh nghiệm không hợp lệ")
    private Short yearsExperience;

    @NotNull(message = "Mức lương không được để trống")
    @DecimalMin(value = "0.01", message = "Mức lương phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Mức lương không hợp lệ")
    private BigDecimal grossAmount;
}
