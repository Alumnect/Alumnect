package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.dto.response.admin.AdminMentorCvResponse;
import com.alumnect.alumnect_backend.service.admin.AdminMentorCvService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý các yêu cầu của Quản trị viên xem danh sách và hồ sơ Mentor (UC96, UC115).
 * Đảm bảo chỉ Quản trị viên (ROLE_ADMIN) mới có quyền truy cập. Không hỗ trợ bất kỳ quy trình Approve/Reject nào.
 * Tiền tố "/api/v1" được tự động bổ sung từ WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping("/admin/mentors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Mentor Management", description = "Các API dành cho Quản trị viên xem danh sách, hồ sơ và CV Mentor (UC96, UC115)")
public class AdminMentorCvController {

    private final AdminMentorCvService adminMentorCvService;

    /**
     * API Lấy danh sách hồ sơ Mentor phân trang kèm bộ lọc đa tiêu chí cho Quản trị viên (UC115).
     *
     * @param keyword Từ khóa tìm kiếm theo tên, email, vị trí hoặc công ty
     * @param status Trạng thái hồ sơ Mentor (ACTIVE, INCOMPLETE, PAYMENT_PENDING, EXPIRED)
     * @param subscriptionStatus Trạng thái gói dịch vụ (ACTIVE, PAID, EXPIRED, PENDING_PAYMENT, CANCELLED)
     * @param pageable Tham số phân trang (trang, kích thước, sắp xếp)
     * @return PageResponse chứa danh sách AdminMentorCvResponse
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách Mentor cho Admin (UC115)", description = "Lấy danh sách phân trang các hồ sơ Mentor hỗ trợ tìm kiếm và lọc đa tiêu chí (UC115)")
    public ResponseEntity<ApiResponse<PageResponse<AdminMentorCvResponse>>> getMentorList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MentorStatus status,
            @RequestParam(required = false) String subscriptionStatus,
            @PageableDefault(size = 10, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("REST request từ Admin lấy danh sách Mentor với keyword='{}', status={}, subscriptionStatus={}", keyword, status, subscriptionStatus);
        PageResponse<AdminMentorCvResponse> response = adminMentorCvService.getMentorList(keyword, status, subscriptionStatus, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Mentor thành công", response));
    }

    /**
     * API Xem thông tin chi tiết hồ sơ quản lý của Mentor (UC115 Bước 35).
     *
     * @param mentorId ID của hồ sơ Mentor (mentorProfileId) hoặc userId
     * @return ApiResponse bọc đối tượng AdminMentorCvResponse
     */
    @GetMapping("/{mentorId}")
    @Operation(summary = "Xem thông tin quản lý Mentor (UC115)", description = "Lấy toàn bộ thông tin hồ sơ, gói dịch vụ, tài khoản ngân hàng và hiệu suất của Mentor")
    public ResponseEntity<ApiResponse<AdminMentorCvResponse>> getMentorDetail(@PathVariable Long mentorId) {
        log.info("REST request từ Admin xem thông tin quản lý Mentor ID: {}", mentorId);
        AdminMentorCvResponse response = adminMentorCvService.getMentorDetail(mentorId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Mentor thành công", response));
    }

    /**
     * API Xem chi tiết thông tin hồ sơ và tệp CV của Mentor theo mentorProfileId (UC96).
     *
     * @param mentorId ID của hồ sơ Mentor (mentorProfileId)
     * @return ApiResponse bọc đối tượng AdminMentorCvResponse
     */
    @GetMapping("/{mentorId}/cv")
    @Operation(summary = "Xem CV của Mentor (UC96)", description = "Lấy chi tiết tệp CV và hồ sơ chuyên môn của Mentor cho Admin xem/đối chứng")
    public ResponseEntity<ApiResponse<AdminMentorCvResponse>> getMentorCv(@PathVariable Long mentorId) {
        log.info("REST request từ Admin xem CV của Mentor ID: {}", mentorId);
        AdminMentorCvResponse response = adminMentorCvService.getMentorCv(mentorId);
        return ResponseEntity.ok(ApiResponse.success("Tải CV Mentor thành công", response));
    }
}
