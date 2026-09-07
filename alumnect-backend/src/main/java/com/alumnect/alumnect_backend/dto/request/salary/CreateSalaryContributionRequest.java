package com.alumnect.alumnect_backend.dto.request.salary;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa dữ liệu yêu cầu đóng góp một mẫu lương ẩn danh lên Salary Board (UC50 - Contribute salary data).
 * <p>
 * {@code industryId} tùy chọn (null nếu chưa chọn ngành); nếu có sẽ được kiểm tra tồn tại ở tầng Service
 * (không tồn tại trả về lỗi 400). {@code currency} tùy chọn — bỏ trống mặc định "VND".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSalaryContributionRequest {

    /** ID ngành nghề liên quan (tùy chọn) — null nếu chưa chọn */
    private Long industryId;

    /** Chức danh công việc (bắt buộc, tối đa 150 ký tự) */
    @NotBlank(message = "Chức danh công việc không được để trống")
    @Size(max = 150, message = "Chức danh công việc không được vượt quá 150 ký tự")
    private String jobTitle;

    /** Tên công ty (tùy chọn, tối đa 150 ký tự) */
    @Size(max = 150, message = "Tên công ty không được vượt quá 150 ký tự")
    private String company;

    /** Khu vực làm việc (tùy chọn, tối đa 120 ký tự) */
    @Size(max = 120, message = "Khu vực làm việc không được vượt quá 120 ký tự")
    private String region;

    /** Số năm kinh nghiệm (tùy chọn, 0-60) */
    @Min(value = 0, message = "Số năm kinh nghiệm không được âm")
    @Max(value = 60, message = "Số năm kinh nghiệm không hợp lệ")
    private Short yearsExperience;

    /** Mức lương gộp hàng tháng (bắt buộc, phải lớn hơn 0) */
    @NotNull(message = "Mức lương không được để trống")
    @DecimalMin(value = "0.01", message = "Mức lương phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Mức lương không hợp lệ")
    private BigDecimal grossAmount;

    /**
     * Đơn vị tiền tệ theo mã ISO 4217 (tùy chọn, bỏ trống mặc định "VND"). KHÔNG dùng {@code @Pattern}
     * vì cần cho phép bỏ trống ({@code null}/chuỗi rỗng) — validate định dạng 3 chữ cái ở tầng Service
     * (nếu có giá trị) để tách rõ "bỏ trống = mặc định VND" khỏi "có giá trị nhưng sai định dạng".
     */
    private String currency;
}
