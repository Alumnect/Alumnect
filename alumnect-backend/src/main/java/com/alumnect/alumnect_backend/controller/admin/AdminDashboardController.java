package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminDashboardSummaryDto;
import com.alumnect.alumnect_backend.service.admin.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các yêu cầu lấy số liệu thống kê tổng quan của hệ thống dành cho Admin.
 */
@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    /**
     * Lấy dữ liệu KPIs và biểu đồ xu hướng đăng ký của hệ thống.
     * Quyền truy cập: Chỉ vai trò ADMIN.
     *
     * @return Đối tượng phản hồi chuẩn chứa dữ liệu thống kê tổng quan
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminDashboardSummaryDto>> getDashboardSummary() {
        AdminDashboardSummaryDto summary = adminDashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê tổng quan thành công", summary));
    }
}
