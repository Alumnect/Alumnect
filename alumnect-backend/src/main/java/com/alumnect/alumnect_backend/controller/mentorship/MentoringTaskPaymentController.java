package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;

import java.util.Map;

/**
 * Controller tiếp nhận và xử lý các yêu cầu thanh toán Mentoring Task qua cổng PayOS (UC105).
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/task-payments")
@RequiredArgsConstructor
@Tag(name = "Mentoring Task Payments", description = "Quản lý thanh toán Mentoring Task qua PayOS (UC105)")
public class MentoringTaskPaymentController {

    private final MentoringTaskPaymentService taskPaymentService;
    private final UserRepository userRepository;

    @PostMapping(value = {"", "/checkout"})
    @Operation(summary = "Khởi tạo thanh toán Task từ Deal đã chốt (DEAL_CONFIRMED)",
               description = "Tạo đơn hàng PayOS, sinh mã VietQR và link checkout cho Học viên (Student)")
    public ResponseEntity<ApiResponse<MentoringTaskPaymentCheckoutResponse>> createTaskPayment(
            @Valid @RequestBody CreateTaskPaymentRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskPaymentCheckoutResponse response = taskPaymentService.createTaskPayment(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo thông tin thanh toán Mentoring Task thành công", response));
    }

    @GetMapping("/{orderCode}/status")
    @Operation(summary = "Tra cứu trạng thái thanh toán Task (Polling & Realtime check)",
               description = "Kiểm tra kết quả thanh toán theo orderCode và kích hoạt Task sang PREPARATION nếu thành công")
    public ResponseEntity<ApiResponse<MentoringTaskPaymentStatusResponse>> checkTaskPaymentStatus(
            @PathVariable Long orderCode) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskPaymentStatusResponse response = taskPaymentService.checkTaskPaymentStatus(currentUserId, orderCode);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/{orderCode}/cancel")
    @Operation(summary = "Hủy bỏ giao dịch thanh toán Task đang chờ xử lý",
               description = "Cho phép Học viên hủy đơn thanh toán đang ở trạng thái PENDING")
    public ResponseEntity<ApiResponse<MentoringTaskPaymentStatusResponse>> cancelTaskPayment(
            @PathVariable Long orderCode) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskPaymentStatusResponse response = taskPaymentService.cancelTaskPayment(currentUserId, orderCode);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Tiếp nhận Webhook IPN từ PayOS Gateway cho Task Payment",
               description = "Endpoint công khai nhận thông báo thanh toán thành công tự động từ PayOS server")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody Webhook webhook) {
        log.info("Tiếp nhận callback Webhook từ PayOS cho Task Payment: {}", webhook);
        taskPaymentService.handlePayOSWebhook(webhook);
        return ResponseEntity.ok(Map.of("error", 0, "message", "Webhook processed successfully"));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang đăng nhập."));
        return user.getId();
    }
}
