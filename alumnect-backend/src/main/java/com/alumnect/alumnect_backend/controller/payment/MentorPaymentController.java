package com.alumnect.alumnect_backend.controller.payment;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.payment.CreateMentorPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.payment.MentorPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.payment.PaymentTransactionStatusResponse;
import com.alumnect.alumnect_backend.service.payment.MentorPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.payos.model.webhooks.Webhook;

import java.util.Map;

/**
 * Controller tiếp nhận và xử lý các yêu cầu API thanh toán gói Mentor qua PayOS (UC93).
 * Quản lý khởi tạo đơn hàng, lấy trạng thái polling thời gian thực, hủy đơn và tiếp nhận Webhook IPN.
 */
@RestController
@RequestMapping("/mentoring/subscriptions/payment")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mentor Payment", description = "Các API phục vụ thanh toán gói Mentor qua cổng PayOS (UC93)")
public class MentorPaymentController {

    private final MentorPaymentService mentorPaymentService;

    /**
     * API khởi tạo phiên thanh toán gói Mentor qua PayOS.
     * Sinh mã VietQR động và đường dẫn PayOS Checkout trực tiếp.
     *
     * @param request DTO tùy chọn chọn gói (giá lấy trực tiếp từ database)
     * @return Phản hồi chuẩn chứa thông tin VietQR và checkoutUrl
     */
    @PostMapping("/checkout")
    @Operation(summary = "Khởi tạo thanh toán gói Mentor", description = "Tạo đơn hàng PayOS và sinh VietQR thanh toán cho gói Mentor được chọn")
    public ResponseEntity<ApiResponse<MentorPaymentCheckoutResponse>> createCheckout(
            @Valid @RequestBody(required = false) CreateMentorPaymentRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentorPaymentCheckoutResponse response = mentorPaymentService.createMentorSubscriptionPayment(email, request);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo thông tin thanh toán PayOS thành công", response));
    }

    /**
     * API kiểm tra trạng thái giao dịch thanh toán PayOS (phục vụ Polling từ Frontend).
     *
     * @param orderCode Mã đơn hàng PayOS
     * @return Phản hồi chuẩn chứa trạng thái thanh toán và Mentor Status mới nhất
     */
    @GetMapping("/status/{orderCode}")
    @Operation(summary = "Tra cứu trạng thái thanh toán", description = "Lấy trạng thái giao dịch thanh toán phục vụ Polling từ Frontend")
    public ResponseEntity<ApiResponse<PaymentTransactionStatusResponse>> getStatus(
            @PathVariable Long orderCode
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        PaymentTransactionStatusResponse response = mentorPaymentService.getPaymentStatus(email, orderCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái giao dịch thành công", response));
    }

    /**
     * API hủy giao dịch thanh toán PayOS đang ở trạng thái PENDING.
     *
     * @param orderCode Mã đơn hàng PayOS cần hủy
     * @return Phản hồi chuẩn chứa trạng thái sau khi hủy (CANCELLED)
     */
    @PostMapping("/cancel/{orderCode}")
    @Operation(summary = "Hủy đơn thanh toán", description = "Hủy phiên thanh toán PayOS đang chờ để người dùng chọn lại gói khác")
    public ResponseEntity<ApiResponse<PaymentTransactionStatusResponse>> cancelPayment(
            @PathVariable Long orderCode
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        PaymentTransactionStatusResponse response = mentorPaymentService.cancelPayment(email, orderCode);
        return ResponseEntity.ok(ApiResponse.success("Hủy giao dịch thanh toán thành công", response));
    }

    /**
     * Endpoint công khai tiếp nhận Webhook IPN từ PayOS server.
     * Được xác thực chữ ký số HMAC-SHA256, thực thi idempotent kích hoạt subscription và tính lại Mentor Status.
     *
     * @param webhook Dữ liệu Webhook gửi từ PayOS
     * @return Phản hồi chuẩn HTTP 200 OK cho PayOS
     */
    @PostMapping("/webhook")
    @Operation(summary = "Tiếp nhận Webhook IPN từ PayOS", description = "Endpoint công khai nhận thông báo thanh toán thành công từ PayOS")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody Webhook webhook) {
        log.info("Nhận callback Webhook từ PayOS: {}", webhook);
        mentorPaymentService.handlePayOSWebhook(webhook);
        return ResponseEntity.ok(Map.of("error", 0, "message", "Webhook processed successfully"));
    }
}
