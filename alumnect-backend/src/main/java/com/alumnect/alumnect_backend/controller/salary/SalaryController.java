package com.alumnect.alumnect_backend.controller.salary;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryStatisticsResponse;
import com.alumnect.alumnect_backend.service.salary.SalaryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý yêu cầu đóng góp dữ liệu lương ẩn danh (UC50) và xem thống kê lương (UC53 -
 * View salary statistics) trên Salary Board. Được map tự động với prefix global /api/v1/salary-contributions.
 * <p>
 * Cả 2 endpoint đều yêu cầu đăng nhập (JWT), Guest bị Spring Security chặn 401 trước khi vào Controller
 * (không nằm {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET}). Đóng góp (POST) chỉ
 * Cựu sinh viên (ALUMNI) được phép (RBAC tại tầng Service — Student/Admin nhận 403); xem thống kê (GET)
 * mở cho mọi vai trò đã đăng nhập (Student + Alumni theo ticket UC53, không hạn chế thêm ở Backend).
 */
@RestController
@RequestMapping("/salary-contributions")
public class SalaryController {

    @Autowired
    private SalaryService salaryService;

    /**
     * API đóng góp một mẫu lương ẩn danh lên Salary Board (UC50 - Contribute salary data).
     *
     * @param request        DTO chứa chức danh + mức lương (bắt buộc), ngành/công ty/khu vực/kinh nghiệm (tùy chọn)
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người đóng góp
     * @return Chi tiết lượt đóng góp vừa tạo {@link SalaryContributionResponse} bọc trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SalaryContributionResponse>> createContribution(
            @Valid @RequestBody CreateSalaryContributionRequest request,
            Authentication authentication) {

        SalaryContributionResponse created = salaryService.createContribution(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đóng góp dữ liệu lương thành công", created));
    }

    /**
     * API lấy thống kê lương tổng hợp cho Salary Board (UC53 - View salary statistics).
     *
     * @return Thống kê lương {@link SalaryStatisticsResponse} bọc trong {@link ApiResponse}, HTTP 200 OK
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<SalaryStatisticsResponse>> getStatistics() {
        SalaryStatisticsResponse statistics = salaryService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê lương thành công", statistics));
    }
}
