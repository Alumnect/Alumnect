package com.alumnect.alumnect_backend.dto.response.salary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa thông tin một lượt đóng góp lương trả về cho Client sau khi gửi thành công
 * (UC50 - Contribute salary data). Cố tình KHÔNG có trường nào định danh người đóng góp
 * (không {@code userId}/{@code author}) — Salary Board cam kết ẩn danh tuyệt đối, chỉ hiển thị
 * số liệu tổng hợp (thuộc UC53 - View salary statistics, ngoài phạm vi UC50).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryContributionResponse {

    /** ID lượt đóng góp (dạng chuỗi để Frontend không mất độ chính xác số lớn) */
    private String id;

    /** Tên ngành nghề (chuỗi rỗng nếu chưa chọn) */
    private String industry;

    /** Chức danh công việc */
    private String jobTitle;

    /** Tên công ty (chuỗi rỗng nếu không có) */
    private String company;

    /** Khu vực làm việc (chuỗi rỗng nếu không có) */
    private String region;

    /** Số năm kinh nghiệm (null nếu không có) */
    private Short yearsExperience;

    /** Mức lương gộp hàng tháng đã đóng góp */
    private BigDecimal grossAmount;

    /** Đơn vị tiền tệ (VD: "VND") */
    private String currency;

    /** Thời điểm đóng góp ở dạng ISO-8601 */
    private String createdAt;
}
