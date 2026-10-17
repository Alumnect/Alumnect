package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import vn.payos.model.webhooks.Webhook;

/**
 * Giao diện dịch vụ thanh toán Mentoring Task qua cổng PayOS (UC105).
 */
public interface MentoringTaskPaymentService {

    /**
     * Khởi tạo giao dịch thanh toán Task từ Deal đã chốt (DEAL_CONFIRMED).
     *
     * @param currentUserId ID của Student đang đăng nhập
     * @param request DTO chứa dealId
     * @return DTO chứa thông tin thanh toán, VietQR và link PayOS
     */
    MentoringTaskPaymentCheckoutResponse createTaskPayment(Long currentUserId, CreateTaskPaymentRequest request);

    /**
     * Tra cứu trạng thái giao dịch thanh toán theo orderCode phục vụ Polling thời gian thực.
     * Tự động kích hoạt Mentoring Task chuyển sang PREPARATION khi thanh toán thành công.
     *
     * @param currentUserId ID người dùng
     * @param orderCode Mã đơn hàng PayOS
     * @return DTO trạng thái thanh toán và thông tin Task được kích hoạt
     */
    MentoringTaskPaymentStatusResponse checkTaskPaymentStatus(Long currentUserId, Long orderCode);

    /**
     * Hủy giao dịch thanh toán Task đang ở trạng thái PENDING.
     *
     * @param currentUserId ID của Student
     * @param orderCode Mã đơn hàng PayOS
     * @return DTO trạng thái sau khi hủy
     */
    MentoringTaskPaymentStatusResponse cancelTaskPayment(Long currentUserId, Long orderCode);

    /**
     * Tiếp nhận và xử lý Webhook IPN từ PayOS server (Nguồn sự thật thanh toán).
     *
     * @param webhook Đối tượng Webhook chứa payload và chữ ký HMAC-SHA256
     */
    void handlePayOSWebhook(Webhook webhook);

    /** Xử lý dữ liệu Webhook PayOS đã được xác thực chữ ký (định tuyến từ PayOSWebhookRouter). */
    void handleVerifiedWebhook(vn.payos.model.webhooks.WebhookData data);

    /** Đối soát một giao dịch PENDING với PayOS (job định kỳ, không phụ thuộc người dùng mở trang thanh toán). */
    void reconcilePendingPayment(Long orderCode);

    /**
     * Hủy các giao dịch top-up đang chờ của một Ticket điều chỉnh (khi Ticket bị thay thế hoặc hủy).
     */
    void cancelPendingTopUpPayments(Long amendmentId, String reason);
}
