package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.RefundAccountRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWalletResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.RefundAccountResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Ví Mentoring: thu nhập Mentor, hoàn tiền Học viên và tài khoản nhận hoàn tiền. */
@RestController
@RequestMapping("/mentoring/wallet")
@RequiredArgsConstructor
@Tag(name = "Mentoring Wallet", description = "Thu nhập Mentor và hoàn tiền Học viên")
public class MentoringWalletController {

    private final MentoringWalletService walletService;

    @GetMapping("/earnings")
    @Operation(summary = "Thu nhập và lịch sử chi trả thù lao của Mentor đang đăng nhập")
    public ResponseEntity<ApiResponse<MentoringWalletResponse>> getEarnings() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thu nhập thành công", walletService.getMentorEarnings(email())));
    }

    @GetMapping("/refunds")
    @Operation(summary = "Các khoản hoàn tiền của Học viên đang đăng nhập")
    public ResponseEntity<ApiResponse<MentoringWalletResponse>> getRefunds() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hoàn tiền thành công", walletService.getMyRefunds(email())));
    }

    @GetMapping("/refund-account")
    @Operation(summary = "Tài khoản nhận hoàn tiền của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<RefundAccountResponse>> getRefundAccount() {
        return ResponseEntity.ok(ApiResponse.success("Lấy tài khoản nhận hoàn tiền thành công", walletService.getRefundAccount(email())));
    }

    @PutMapping("/refund-account")
    @Operation(summary = "Cập nhật tài khoản nhận hoàn tiền")
    public ResponseEntity<ApiResponse<RefundAccountResponse>> saveRefundAccount(@Valid @RequestBody RefundAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã lưu tài khoản nhận hoàn tiền", walletService.saveRefundAccount(email(), request)));
    }

    private String email() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
