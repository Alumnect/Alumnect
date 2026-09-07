package com.alumnect.alumnect_backend.controller.salary;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.request.salary.UpdateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryStatisticsResponse;
import com.alumnect.alumnect_backend.service.salary.SalaryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý yêu cầu đóng góp (UC50), chỉnh sửa (UC51), xóa (UC52 - Delete salary
 * contribution) và xem thống kê lương (UC53 - View salary statistics) trên Salary Board. Được map
 * tự động với prefix global /api/v1/salary-contributions.
 * <p>
 * Mọi endpoint đều yêu cầu đăng nhập (JWT), Guest bị Spring Security chặn 401 trước khi vào Controller
 * (không nằm {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET}). Đóng góp (POST) chỉ
 * Cựu sinh viên (ALUMNI) được phép (RBAC tại tầng Service — Student/Admin nhận 403); sửa (PUT) và xóa
 * (DELETE) chỉ chính chủ được phép (kiểm tra sở hữu tại tầng Service — người khác nhận 403); xem thống
 * kê (GET) mở cho mọi vai trò đã đăng nhập (Student + Alumni theo ticket UC53, không hạn chế thêm ở Backend).
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
     * API lấy toàn bộ lượt đóng góp lương của chính người dùng đang đăng nhập (UC51 - Edit salary
     * contribution) — để họ xem lại và chọn bản ghi cần sửa.
     *
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email chính chủ
     * @return Danh sách lượt đóng góp {@link SalaryContributionResponse} bọc trong {@link ApiResponse}, HTTP 200 OK
     */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<SalaryContributionResponse>>> getMyContributions(Authentication authentication) {
        List<SalaryContributionResponse> mine = salaryService.getMyContributions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đóng góp của bạn thành công", mine));
    }

    /**
     * API chỉnh sửa một lượt đóng góp lương đã có (UC51 - Edit salary contribution). Chỉ chính chủ
     * mới sửa được — người khác nhận 403.
     *
     * @param contributionId ID lượt đóng góp cần sửa
     * @param request        DTO chứa dữ liệu lương mới (cùng bộ trường với lúc tạo)
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email chính chủ
     * @return Chi tiết lượt đóng góp sau khi sửa {@link SalaryContributionResponse} bọc trong {@link ApiResponse}, HTTP 200 OK
     */
    @PutMapping("/{contributionId}")
    public ResponseEntity<ApiResponse<SalaryContributionResponse>> updateContribution(
            @PathVariable Long contributionId,
            @Valid @RequestBody UpdateSalaryContributionRequest request,
            Authentication authentication) {

        SalaryContributionResponse updated = salaryService.updateContribution(authentication.getName(), contributionId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật dữ liệu lương thành công", updated));
    }

    /**
     * API xóa một lượt đóng góp lương đã có (UC52 - Delete salary contribution). Xóa cứng, không
     * thể hoàn tác. Chỉ chính chủ mới xóa được — người khác nhận 403.
     *
     * @param contributionId ID lượt đóng góp cần xóa
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email chính chủ
     * @return {@link ApiResponse} rỗng, HTTP 200 OK
     */
    @DeleteMapping("/{contributionId}")
    public ResponseEntity<ApiResponse<Void>> deleteContribution(@PathVariable Long contributionId, Authentication authentication) {
        salaryService.deleteContribution(authentication.getName(), contributionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa dữ liệu lương thành công", null));
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
