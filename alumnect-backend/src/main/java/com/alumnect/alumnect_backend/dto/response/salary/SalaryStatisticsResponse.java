package com.alumnect.alumnect_backend.dto.response.salary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO tổng hợp thống kê Salary Board (UC53 - View salary statistics): số liệu tổng quan (KPI cards)
 * và danh sách dòng thống kê theo nhóm chức danh + cấp bậc + khu vực.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryStatisticsResponse {

    /** Tổng số lượt đóng góp đã ghi nhận (mọi loại tiền tệ, không lọc theo ngưỡng mẫu tối thiểu) */
    private long totalContributions;

    /** Số nhóm (chức danh + cấp bậc + khu vực) đủ điều kiện hiển thị (đạt ngưỡng mẫu tối thiểu) */
    private long trackedPositions;

    /** Trung vị mức lương gộp/tháng trên toàn bộ dữ liệu VND (đơn vị: Triệu VNĐ), null nếu chưa có dữ liệu VND nào */
    private BigDecimal overallMedian;

    /** Danh sách dòng thống kê theo nhóm, sắp xếp theo số mẫu giảm dần */
    private List<SalaryStatRowResponse> rows;
}
