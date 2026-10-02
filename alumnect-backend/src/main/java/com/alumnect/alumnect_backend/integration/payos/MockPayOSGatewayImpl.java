package com.alumnect.alumnect_backend.integration.payos;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

/**
 * Triển khai giả lập (Mock) cho PayOSGateway phục vụ riêng môi trường test/local-test.
 * Tuyệt đối không kích hoạt ở môi trường production.
 */
@Component
@Profile({"test", "local-test"})
@Slf4j
public class MockPayOSGatewayImpl implements PayOSGateway {

    @Override
    public CreatePaymentLinkResponse createPaymentLink(CreatePaymentLinkRequest request) {
        log.info("[MOCK] Giả lập tạo payment link PayOS cho orderCode={}", request.getOrderCode());
        return CreatePaymentLinkResponse.builder()
                .bin("970422")
                .accountNumber("0987654321")
                .accountName("CONG TY ALUMNECT TEST")
                .amount(request.getAmount())
                .description(request.getDescription())
                .orderCode(request.getOrderCode())
                .paymentLinkId("mock-link-" + request.getOrderCode())
                .status(PaymentLinkStatus.PENDING)
                .checkoutUrl("https://mock.payos.vn/checkout/" + request.getOrderCode())
                .currency("VND")
                .qrCode("00020101021238540010A00000072701260006970422011209876543210208QRIBFTTA5303704540" + request.getAmount() + "5802VN62180814" + request.getDescription() + "6304MOCK")
                .build();
    }

    @Override
    public PaymentLink getPaymentLinkInformation(Long orderCode) {
        log.info("[MOCK] Giả lập tra cứu payment link PayOS cho orderCode={}", orderCode);
        return PaymentLink.builder()
                .orderCode(orderCode)
                .status(PaymentLinkStatus.PENDING)
                .build();
    }

    @Override
    public PaymentLink cancelPaymentLink(Long orderCode, String cancellationReason) {
        log.info("[MOCK] Giả lập hủy payment link PayOS cho orderCode={}, reason={}", orderCode, cancellationReason);
        return PaymentLink.builder()
                .orderCode(orderCode)
                .status(PaymentLinkStatus.CANCELLED)
                .build();
    }

    @Override
    public WebhookData verifyPaymentWebhookData(Webhook webhook) {
        log.info("[MOCK] Giả lập xác thực Webhook PayOS cho test");
        return webhook != null ? webhook.getData() : null;
    }
}
