package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.dto.response.admin.AdminDashboardSummaryDto;

/**
 * Service định nghĩa các nghiệp vụ thống kê hệ thống dành cho Admin.
 */
public interface AdminDashboardService {

    /**
     * Lấy dữ liệu thống kê tổng quan hệ thống KPIs và biểu đồ đăng ký.
     *
     * @return DTO thống kê tổng quan
     */
    AdminDashboardSummaryDto getDashboardSummary();
}
