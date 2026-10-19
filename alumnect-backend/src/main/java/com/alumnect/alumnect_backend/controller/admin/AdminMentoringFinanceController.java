package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.AdminTaskFundDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.AdminTaskFundSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringPaymentLedgerResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringFinanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Controller Quản lý Quỹ Task, Sổ quỹ giao dịch và lịch sử tài chính cho Quản trị viên (UC121 & Mục 5.7, 5.10).
 */
@Slf4j
@RestController
@RequestMapping("/admin/mentoring/finances")
@RequiredArgsConstructor
@Tag(name = "Admin Mentoring Finances", description = "Quản lý Sổ quỹ dòng tiền, Escrow và Đối soát theo Task (UC121)")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMentoringFinanceController {

    private final MentoringFinanceService financeService;
    private final UserRepository userRepository;

    /**
     * API Tra cứu danh sách Quỹ và dòng tiền theo từng Task Mentoring (UC121).
     */
    @GetMapping("/tasks")
    @Operation(summary = "Xem danh sách Quỹ và dòng tiền theo Task (UC121)",
               description = "Tra cứu số liệu Escrow, thù lao chi Cố vấn, hoàn trả Học viên, phí và trạng thái quyết toán theo Task")
    public ResponseEntity<ApiResponse<PageResponse<AdminTaskFundSummaryResponse>>> getTaskFunds(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String settlementStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long currentUserId = getCurrentUserId();
        log.info("Admin {} yêu cầu xem danh sách Quỹ Task: keyword={}, status={}, settlementStatus={}",
                currentUserId, keyword, status, settlementStatus);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<AdminTaskFundSummaryResponse> response = financeService.getTaskFunds(
                currentUserId, keyword, status, settlementStatus, pageable);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Quỹ Task thành công", response));
    }

    /**
     * API Xem chi tiết toàn diện Sổ quỹ giao dịch, lịch sử gia hạn, điều chỉnh và quyết định phân bổ của Task (UC121).
     */
    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "Xem chi tiết Sổ quỹ và lịch sử tài chính của Task (UC121)",
               description = "Đối soát toàn bộ các giao dịch ký quỹ, chi trả, hoàn tiền và các mốc deadline snapshot")
    public ResponseEntity<ApiResponse<AdminTaskFundDetailResponse>> getTaskFundDetail(
            @PathVariable Long taskId
    ) {
        Long currentUserId = getCurrentUserId();
        log.info("Admin {} yêu cầu xem chi tiết Sổ quỹ Task ID: {}", currentUserId, taskId);

        AdminTaskFundDetailResponse response = financeService.getTaskFundDetail(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết Sổ quỹ Task thành công", response));
    }

    /**
     * API Chi lại thù lao Mentor cho lệnh chi đã thất bại (sau khi Mentor sửa tài khoản / nạp số dư Kênh chi).
     */
    @PostMapping("/ledgers/{ledgerId}/retry-payout")
    @Operation(summary = "Chi lại thù lao Mentor cho lệnh chi FAILED",
               description = "Mở lại lệnh chi với idempotency key mới và gửi lại sang PayOS Kênh chi")
    public ResponseEntity<ApiResponse<MentoringPaymentLedgerResponse>> retryPayout(
            @PathVariable Long ledgerId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        Long currentUserId = getCurrentUserId();
        String note = body != null ? body.get("note") : null;
        MentoringPaymentLedgerResponse response = financeService.retryFailedPayout(currentUserId, ledgerId, note);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi lại lệnh chi thù lao", response));
    }

    /**
     * API Xem số dư tài khoản Kênh chi PayOS để bảo đảm đủ tiền chi trả thù lao.
     */
    @GetMapping("/payout-balance")
    @Operation(summary = "Xem số dư Kênh chi PayOS")
    public ResponseEntity<ApiResponse<BigDecimal>> getPayoutBalance() {
        return ResponseEntity.ok(ApiResponse.success("Lấy số dư Kênh chi thành công", financeService.getPayoutBalance()));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng đăng nhập."));
        return user.getId();
    }
}
