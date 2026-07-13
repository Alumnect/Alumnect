package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.verification.AdminReviewVerificationDto;
import com.alumnect.alumnect_backend.dto.response.verification.AdminVerificationRequestDto;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.verification.AdminVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller kiểm duyệt hồ sơ minh chứng cựu sinh viên (Alumni) dành cho Admin.
 */
@RestController
@RequestMapping("/admin/verifications")
@RequiredArgsConstructor
public class AdminVerificationController {

    private final AdminVerificationService adminVerificationService;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách các phiếu yêu cầu xác minh cựu sinh viên phân trang.
     * Cho phép lọc theo trạng thái duyệt (PENDING, APPROVED, REJECTED).
     * Quyền truy cập: Chỉ vai trò ADMIN.
     *
     * @param status Trạng thái lọc (tùy chọn)
     * @param page Số thứ tự trang, mặc định 0
     * @param size Số lượng phần tử trên trang, mặc định 10
     * @return Trang kết quả phiếu xác minh bọc trong PageResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminVerificationRequestDto>>> getVerificationRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<AdminVerificationRequestDto> requests = adminVerificationService.getVerificationRequests(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu yêu cầu xác minh thành công", requests));
    }

    /**
     * Admin thực hiện phê duyệt hoặc từ chối phiếu xác minh cựu sinh viên.
     * Quyền truy cập: Chỉ vai trò ADMIN.
     *
     * @param id Khóa chính của phiếu yêu cầu xác minh
     * @param request DTO phê duyệt chứa quyết định và lý do nhận xét
     * @param principal Thông tin tài khoản Admin đăng nhập hiện tại
     * @return Phản hồi trống báo trạng thái thành công
     */
    @RequestMapping(value = "/{id}/review", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<Void>> reviewVerification(
            @PathVariable Long id,
            @Valid @RequestBody AdminReviewVerificationDto request,
            Principal principal) {
        String adminEmail = principal.getName();
        User adminUser = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin Quản trị viên"));

        adminVerificationService.reviewVerificationRequest(id, request, adminUser);
        String msg = "APPROVED".equalsIgnoreCase(request.getStatus()) ? "Phê duyệt hồ sơ cựu sinh viên thành công" : "Từ chối hồ sơ cựu sinh viên thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }
}
