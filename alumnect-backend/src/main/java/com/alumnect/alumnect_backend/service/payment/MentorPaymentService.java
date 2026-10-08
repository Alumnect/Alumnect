package com.alumnect.alumnect_backend.service.payment;

import com.alumnect.alumnect_backend.dto.request.payment.CreateMentorPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.payment.MentorPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.payment.PaymentTransactionStatusResponse;
import vn.payos.model.webhooks.Webhook;

/**
 * Interface dịch vụ xử lý thanh toán gói Mentor Subscription qua PayOS (UC93).
 * Đảm bảo phân tách rõ ràng với thanh toán Mentoring Task (UC105),
 * xử lý callback idempotent, gia hạn bảo toàn thời gian và tính toán lại Mentor Status.
 */
public interface MentorPaymentService {

    /**
     * Khởi tạo giao dịch thanh toán gói Mentor Subscription qua cổng PayOS (UC93).
     *
     * @param userEmail Email của người dùng đăng nhập (ALUMNI/Mentor)
     * @param request DTO chứa mã gói (tùy chọn, giá lấy từ DB)
     * @return DTO chứa thông tin đơn hàng, VietQR, checkoutUrl PayOS
     */
    MentorPaymentCheckoutResponse createMentorSubscriptionPayment(String userEmail, CreateMentorPaymentRequest request);

    /**
     * Lấy trạng thái giao dịch thanh toán theo orderCode phục vụ polling từ Frontend.
     *
     * @param userEmail Email người dùng đăng nhập
     * @param orderCode Mã đơn hàng PayOS
     * @return DTO trạng thái giao dịch và trạng thái Mentor hiện tại
     */
    PaymentTransactionStatusResponse getPaymentStatus(String userEmail, Long orderCode);

    /**
     * Hủy đơn thanh toán đang ở trạng thái PENDING.
     *
     * @param userEmail Email người dùng đăng nhập
     * @param orderCode Mã đơn hàng PayOS
     * @return DTO trạng thái sau khi hủy
     */
    PaymentTransactionStatusResponse cancelPayment(String userEmail, Long orderCode);

    /**
     * Tiếp nhận và xử lý Webhook IPN từ PayOS (Source of Truth để kích hoạt subscription).
     * Thực hiện kiểm tra chữ ký HMAC-SHA256, khóa bi quan chống race-condition,
     * đảm bảo Idempotency không cộng trùng ngày và tính toán lại Mentor Status.
     *
     * @param webhook Đối tượng Webhook chứa data và signature từ PayOS
     */
    void handlePayOSWebhook(Webhook webhook);
}
