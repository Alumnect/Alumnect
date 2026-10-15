package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.disbursement.MentoringDisbursementGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringDisbursementServiceImpl implements MentoringDisbursementService {

    private final MentoringTaskRepository taskRepository;
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final MentoringPayoutProcessor payoutProcessor;
    private final MentoringDisbursementGateway disbursementGateway;

    @Override
    @Transactional
    public MentoringPaymentLedger disbursePayout(Long currentUserId, Long taskId, String note) {
        log.info("Xếp hàng payout cho taskId={} bởi userId={}", taskId, currentUserId);
        MentoringTask task = taskRepository.findByIdForPayout(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));
        if (task.getStatus() != MentoringTaskStatus.COMPLETED) {
            throw new ConflictException("Chỉ chi trả khi Task đã hoàn thành và nghiệm thu.");
        }

        var existing = ledgerRepository.findFirstByTaskIdAndTransactionTypeOrderByCreatedAtDesc(
                taskId, MentoringLedgerTransactionType.PAYOUT);
        if (existing.isPresent()) {
            dispatchPayoutAfterCommit(existing.get().getId());
            return existing.get();
        }

        MentoringPaymentLedger ledger = ledgerRepository.saveAndFlush(MentoringPaymentLedger.builder()
                .request(task.getRequest() != null ? task.getRequest() : task.getDeal().getRequest())
                .task(task)
                .deal(task.getDeal())
                .student(task.getStudent())
                .mentor(task.getMentor())
                .amount(task.getAgreedPrice())
                .transactionType(MentoringLedgerTransactionType.PAYOUT)
                .status(MentoringLedgerStatus.PENDING)
                .idempotencyKey("ALUMNECT-PAYOUT-TASK-" + task.getId())
                .providerStatus(MentoringPayoutProcessor.QUEUED)
                .deadlineSnapshot(task.getDeadline())
                .note(note)
                .build());
        dispatchPayoutAfterCommit(ledger.getId());
        return ledger;
    }

    @Override
    public void dispatchPayoutAfterCommit(Long ledgerId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            dispatchQuietly(ledgerId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                dispatchQuietly(ledgerId);
            }
        });
    }

    @Override
    public MentoringPaymentLedger retryFailedPayout(Long adminUserId, Long ledgerId, String note) {
        log.info("Admin {} yêu cầu chi lại payout ledgerId={}", adminUserId, ledgerId);
        payoutProcessor.resetForRetry(ledgerId, note);
        try {
            return payoutProcessor.dispatch(ledgerId);
        } catch (Exception ex) {
            log.warn("Chưa gửi lại được payout ledgerId={}, scheduler sẽ thử lại: {}", ledgerId, ex.getMessage());
            return ledgerRepository.findById(ledgerId).orElseThrow();
        }
    }

    @Override
    public BigDecimal getPayoutBalance() {
        return disbursementGateway.getPayoutBalance();
    }

    @Override
    public void synchronizePendingPayouts() {
        ledgerRepository.findIdsByTransactionTypeAndStatus(
                        MentoringLedgerTransactionType.PAYOUT, MentoringLedgerStatus.PENDING)
                .forEach(this::dispatchQuietly);
        ledgerRepository.findIdsByTransactionTypeAndStatus(
                        MentoringLedgerTransactionType.REFUND, MentoringLedgerStatus.PENDING)
                .forEach(this::dispatchQuietly);
    }

    /** Lỗi gửi/đồng bộ không được làm hỏng luồng gọi; ledger vẫn PENDING và scheduler sẽ xử lý lại. */
    private void dispatchQuietly(Long ledgerId) {
        try {
            payoutProcessor.dispatch(ledgerId);
        } catch (Exception ex) {
            log.warn("Chưa xử lý được payout ledgerId={}: {}", ledgerId, ex.getMessage());
        }
    }
}
