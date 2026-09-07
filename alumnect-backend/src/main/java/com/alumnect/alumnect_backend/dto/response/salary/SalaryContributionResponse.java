package com.alumnect.alumnect_backend.dto.response.salary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa thông tin một lượt đóng góp lương — trả về cho Client sau khi tạo (UC50), khi xem danh
 * sách đóng góp của chính mình (UC51 - Edit salary contribution), và sau khi chỉnh sửa. Cố tình
 * KHÔNG có trường nào định danh người đóng góp (không {@code userId}/{@code author}) — Salary Board
 * cam kết ẩn danh tuyệt đối với người khác (chỉ hiển thị số liệu tổng hợp — UC53). {@code industryId}
 * KHÔNG phải thông tin định danh cá nhân nên được trả kèm để Frontend điền sẵn dropdown khi sửa.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryContributionResponse {

    /** ID lượt đóng góp (dạng chuỗi để Frontend không mất độ chính xác số lớn) */
    private String id;

    /** ID ngành nghề (null nếu chưa chọn) — dùng để điền sẵn dropdown khi chỉnh sửa (UC51) */
    private Long industryId;

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
