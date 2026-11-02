package com.alumnect.alumnect_backend.scheduler.payment;

import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskPaymentService;
import com.alumnect.alumnect_backend.service.payment.MentorPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Đối soát định kỳ các giao dịch thu tiền PENDING với PayOS.
 * Bảo đảm tiền đã trả luôn được ghi nhận kể cả khi Webhook không tới (localhost, sai URL)
 * và người dùng đã đóng trang thanh toán (không còn polling từ trình duyệt).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PayOSPaymentReconciliationScheduler {

    private final MentoringTaskPaymentRepository taskPaymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MentoringTaskPaymentService taskPaymentService;
    private final MentorPaymentService mentorPaymentService;

    @Scheduled(fixedDelayString = "${app.payos.reconcile-delay-ms:120000}", initialDelayString = "${app.payos.reconcile-initial-delay-ms:60000}")
    public void reconcilePendingPayments() {
        for (Long orderCode : taskPaymentRepository.findPendingOrderCodes()) {
            try {
                taskPaymentService.reconcilePendingPayment(orderCode);
            } catch (Exception ex) {
                log.warn("Đối soát thanh toán Task orderCode={} chưa thành công: {}", orderCode, ex.getMessage());
            }
        }
        for (Long orderCode : paymentTransactionRepository.findPendingOrderCodes()) {
            try {
                mentorPaymentService.reconcilePendingPayment(orderCode);
            } catch (Exception ex) {
                log.warn("Đối soát gói Mentor orderCode={} chưa thành công: {}", orderCode, ex.getMessage());
            }
        }
    }
}
