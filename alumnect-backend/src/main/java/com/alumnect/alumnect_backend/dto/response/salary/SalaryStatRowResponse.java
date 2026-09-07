package com.alumnect.alumnect_backend.dto.response.salary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO một dòng thống kê lương theo nhóm (chức danh + cấp bậc + khu vực) cho Salary Board
 * (UC53 - View salary statistics). Chỉ trả về khi nhóm đạt đủ số mẫu tối thiểu (xem
 * {@code SalaryServiceImpl.MIN_SAMPLE_SIZE}) — bảo vệ ẩn danh, tránh lộ dữ liệu của 1-2 cá nhân.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryStatRowResponse {

    /** Chức danh công việc (job_title, dùng nguyên văn — không chuẩn hóa) */
    private String role;

    /** Cấp bậc suy ra từ số năm kinh nghiệm trung bình của nhóm: Junior / Mid / Senior */
    private String level;

    /** Khu vực làm việc ("Chưa xác định" nếu người đóng góp bỏ trống) */
    private String region;

    /** Trung vị mức lương gộp/tháng của nhóm (đơn vị: Triệu VNĐ) */
    private BigDecimal median;

    /** Tứ phân vị thứ nhất (P25) mức lương gộp/tháng của nhóm (đơn vị: Triệu VNĐ) */
    private BigDecimal p25;

    /** Tứ phân vị thứ ba (P75) mức lương gộp/tháng của nhóm (đơn vị: Triệu VNĐ) */
    private BigDecimal p75;

    /** Số mẫu khảo sát trong nhóm */
    private long samples;
}
