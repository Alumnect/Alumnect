package com.alumnect.alumnect_backend.service.payment;

import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

/**
 * Điểm nhận Webhook PayOS duy nhất cho Kênh thu.
 * PayOS chỉ cho cấu hình một URL Webhook, trong khi hệ thống có hai luồng thu tiền
 * (gói Mentor và thanh toán Mentoring Task): xác thực chữ ký một lần rồi định tuyến theo orderCode.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayOSWebhookRouter {

    private final PayOSGateway payOSGateway;
    private final MentoringTaskPaymentRepository taskPaymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MentoringTaskPaymentService taskPaymentService;
    private final MentorPaymentService mentorPaymentService;

    public void route(Webhook webhook) {
        WebhookData data;
        try {
            data = payOSGateway.verifyPaymentWebhookData(webhook);
        } catch (Exception ex) {
            log.error("Xác thực chữ ký Webhook PayOS thất bại: {}", ex.getMessage());
            throw new BadRequestException("Chữ ký Webhook PayOS không hợp lệ.");
        }
        if (data == null || data.getOrderCode() == null) {
            throw new BadRequestException("Dữ liệu Webhook PayOS không hợp lệ.");
        }

        Long orderCode = data.getOrderCode();
        if (taskPaymentRepository.existsByOrderCode(orderCode)) {
            taskPaymentService.handleVerifiedWebhook(data);
        } else if (paymentTransactionRepository.existsByOrderCode(orderCode)) {
            mentorPaymentService.handleVerifiedWebhook(data);
        } else {
            // Payload kiểm tra khi xác nhận Webhook trên dashboard PayOS, hoặc orderCode không thuộc hệ thống
            log.info("Webhook PayOS orderCode={} không thuộc giao dịch nào, bỏ qua.", orderCode);
        }
    }
}
