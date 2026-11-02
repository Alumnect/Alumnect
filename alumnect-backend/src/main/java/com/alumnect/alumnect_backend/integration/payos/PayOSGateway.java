package com.alumnect.alumnect_backend.integration.payos;

import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

/**
 * Cổng giao tiếp với hệ thống PayOS Gateway.
 * Trừu tượng hóa việc tương tác PayOS SDK 2.0.1 phục vụ tạo đơn, hủy đơn, kiểm tra trạng thái và xác thực webhook.
 */
public interface PayOSGateway {

    /**
     * Tạo yêu cầu thanh toán (Payment Link) qua PayOS.
     *
     * @param request DTO yêu cầu tạo link
     * @return Phản hồi chứa checkoutUrl, qrCode, orderCode từ PayOS
     */
    CreatePaymentLinkResponse createPaymentLink(CreatePaymentLinkRequest request);

    /**
     * Lấy thông tin chi tiết của link thanh toán từ PayOS theo orderCode.
     *
     * @param orderCode Mã đơn hàng
     * @return Thông tin link thanh toán từ PayOS
     */
    PaymentLink getPaymentLinkInformation(Long orderCode);

    /**
     * Hủy link thanh toán trên PayOS.
     *
     * @param orderCode Mã đơn hàng
     * @param cancellationReason Lý do hủy
     * @return Thông tin link sau khi hủy
     */
    PaymentLink cancelPaymentLink(Long orderCode, String cancellationReason);

    /**
     * Xác thực chữ ký số HMAC-SHA256 của Webhook dữ liệu từ PayOS.
     *
     * @param webhook Đối tượng Webhook nhận được từ PayOS
     * @return Dữ liệu WebhookData đã được xác thực an toàn
     */
    WebhookData verifyPaymentWebhookData(Webhook webhook);
}
