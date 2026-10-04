package com.alumnect.alumnect_backend.integration.payos;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

/**
 * Triển khai chính thức PayOS Gateway sử dụng PayOS Java SDK 2.0.1.
 * Tuân thủ API mới: paymentRequests().create(), get(), cancel(), webhooks().verify().
 */
@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class PayOSGatewayImpl implements PayOSGateway {

    private final PayOS payOS;

    /**
     * Tạo yêu cầu thanh toán (Payment Link) qua PayOS SDK 2.0.1.
     *
     * @param request DTO yêu cầu tạo link
     * @return Phản hồi chứa checkoutUrl, qrCode, orderCode từ PayOS
     */
    @Override
    public CreatePaymentLinkResponse createPaymentLink(CreatePaymentLinkRequest request) {
        log.info("Gọi PayOS SDK paymentRequests().create() cho orderCode={}", request.getOrderCode());
        return payOS.paymentRequests().create(request);
    }

    /**
     * Lấy thông tin chi tiết của link thanh toán từ PayOS theo orderCode.
     *
     * @param orderCode Mã đơn hàng
     * @return Thông tin link thanh toán từ PayOS
     */
    @Override
    public PaymentLink getPaymentLinkInformation(Long orderCode) {
        log.info("Gọi PayOS SDK paymentRequests().get() cho orderCode={}", orderCode);
        return payOS.paymentRequests().get(orderCode);
    }

    /**
     * Hủy link thanh toán trên PayOS theo orderCode.
     *
     * @param orderCode Mã đơn hàng
     * @param cancellationReason Lý do hủy đơn
     * @return Thông tin link thanh toán sau khi hủy
     */
    @Override
    public PaymentLink cancelPaymentLink(Long orderCode, String cancellationReason) {
        log.info("Gọi PayOS SDK paymentRequests().cancel() cho orderCode={}, reason={}", orderCode, cancellationReason);
        return payOS.paymentRequests().cancel(orderCode, cancellationReason);
    }

    /**
     * Xác thực chữ ký số HMAC-SHA256 của Webhook dữ liệu từ PayOS bằng webhooks().verify().
     *
     * @param webhook Đối tượng Webhook nhận được từ PayOS
     * @return Dữ liệu WebhookData đã được xác thực an toàn
     */
    @Override
    public WebhookData verifyPaymentWebhookData(Webhook webhook) {
        log.info("Gọi PayOS SDK webhooks().verify() xác thực chữ ký Webhook");
        return payOS.webhooks().verify(webhook);
    }
}
