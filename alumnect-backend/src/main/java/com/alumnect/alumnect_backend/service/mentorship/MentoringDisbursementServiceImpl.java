package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementCommand;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementResult;
import com.alumnect.alumnect_backend.integration.disbursement.MentoringDisbursementGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Triển khai dịch vụ chi tiền (Payout / Refund) Mentoring.
 * Tách biệt luồng chi khỏi luồng thu, ghi nhận đầy đủ sổ quỹ giao dịch (UC105, UC118).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringDisbursementServiceImpl implements MentoringDisbursementService {

    private final MentoringTaskRepository taskRepository;
    private final MentoringRequestRepository requestRepository;
    private final MentorPayoutAccountRepository payoutAccountRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final MentoringTaskPaymentRepository paymentRepository;
    private final MentoringDisbursementGateway disbursementGateway;

    @Override
    @Transactional
    public MentoringPaymentLedger disbursePayout(Long currentUserId, Long taskId, String note) {
        log.info("Thực hiện chi trả thù lao (Payout) cho Task id={} bởi userId={}", taskId, currentUserId);

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhiệm vụ Mentoring Task với ID: " + taskId));

        // 1. Kiểm tra trạng thái Task: phải là COMPLETED mới được payout
        if (task.getStatus() != MentoringTaskStatus.COMPLETED) {
            throw new ConflictException("Chỉ có thể chi trả thù lao cho nhiệm vụ đã hoàn thành và nghiệm thu (COMPLETED). Trạng thái hiện tại: " + task.getStatus());
        }

        // 2. Chống chi trả trùng (Idempotent check trên ledger)
        boolean alreadyPaidOut = ledgerRepository.findByTaskId(task.getId()).stream()
                .anyMatch(l -> l.getTransactionType() == MentoringLedgerTransactionType.PAYOUT
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED);
        if (alreadyPaidOut) {
            throw new ConflictException("Nhiệm vụ này đã được chi trả thù lao cho Cố vấn trước đó rồi.");
        }

        // 3. Lấy thông tin tài khoản ngân hàng thụ hưởng của Mentor
        MentorProfile mentorProfile = mentorProfileRepository.findByUserId(task.getMentor().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor của người hướng dẫn."));

        MentorPayoutAccount payoutAccount = payoutAccountRepository.findByMentorProfileId(mentorProfile.getId())
                .orElseThrow(() -> new BadRequestException("Cố vấn chưa thiết lập thông tin tài khoản ngân hàng thụ hưởng (Payout Account)."));

        if (payoutAccount.getBankName() == null || payoutAccount.getBankAccountNumber() == null || payoutAccount.getBankAccountHolder() == null) {
            throw new BadRequestException("Thông tin tài khoản ngân hàng thụ hưởng của Cố vấn chưa đầy đủ.");
        }

        // 4. Lập lệnh chi tiền
        BigDecimal amount = task.getAgreedPrice();
        DisbursementCommand command = DisbursementCommand.builder()
                .taskId(task.getId())
                .requestId(task.getRequest() != null ? task.getRequest().getId() : null)
                .dealId(task.getDeal().getId())
                .beneficiaryUserId(task.getMentor().getId())
                .amount(amount)
                .bankName(payoutAccount.getBankName())
                .bankAccountNumber(payoutAccount.getBankAccountNumber())
                .bankAccountHolder(payoutAccount.getBankAccountHolder())
                .description("PAYOUT TASK #" + task.getId())
                .build();

        DisbursementResult result = disbursementGateway.processPayout(command);

        // 5. Ghi nhận Sổ quỹ giao dịch Mentoring
        MentoringPaymentLedger ledger = MentoringPaymentLedger.builder()
                .request(task.getRequest() != null ? task.getRequest() : task.getDeal().getRequest())
                .task(task)
                .deal(task.getDeal())
                .student(task.getStudent())
                .mentor(task.getMentor())
                .amount(amount)
                .transactionType(MentoringLedgerTransactionType.PAYOUT)
                .status(result.getStatus())
                .providerReference(result.getProviderReference())
                .deadlineSnapshot(task.getDeadline())
                .note(note != null && !note.isBlank() ? note : result.getMessage())
                .build();

        MentoringPaymentLedger savedLedger = ledgerRepository.save(ledger);
        log.info("Đã ghi nhận giao dịch Payout vào Sổ quỹ: ledgerId={}, status={}, ref={}",
                savedLedger.getId(), savedLedger.getStatus(), savedLedger.getProviderReference());

        return savedLedger;
    }

    @Override
    @Transactional
    public MentoringPaymentLedger disburseRefund(Long currentUserId, Long requestId, String reason) {
        log.info("Thực hiện hoàn tiền (Refund) cho Request id={} bởi userId={}", requestId, currentUserId);

        MentoringRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu Mentoring Request với ID: " + requestId));

        // 1. Tìm bản ghi ký quỹ thành công gốc trong sổ quỹ
        MentoringPaymentLedger collectionLedger = ledgerRepository.findByRequestId(request.getId()).stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.ESCROW_COLLECTION
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED)
                .findFirst()
                .orElseThrow(() -> new ConflictException("Không tìm thấy giao dịch ký quỹ thu tiền thành công nào của Request này để hoàn tiền."));

        // 2. Chống hoàn tiền lặp lại
        boolean alreadyRefunded = ledgerRepository.findByRequestId(request.getId()).stream()
                .anyMatch(l -> l.getTransactionType() == MentoringLedgerTransactionType.REFUND
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED);
        if (alreadyRefunded) {
            throw new ConflictException("Yêu cầu này đã được xử lý hoàn tiền trước đó rồi.");
        }

        // 3. Lập lệnh hoàn tiền qua cổng
        DisbursementCommand command = DisbursementCommand.builder()
                .requestId(request.getId())
                .dealId(collectionLedger.getDeal().getId())
                .taskId(collectionLedger.getTask() != null ? collectionLedger.getTask().getId() : null)
                .beneficiaryUserId(request.getStudent().getId())
                .amount(collectionLedger.getAmount())
                .originalPaymentReference(collectionLedger.getProviderReference())
                .description("REFUND REQ #" + request.getId() + ": " + (reason != null ? reason : "Hoàn tiền"))
                .build();

        DisbursementResult result = disbursementGateway.processRefund(command);

        // 4. Ghi nhận Sổ quỹ giao dịch Mentoring
        MentoringPaymentLedger refundLedger = MentoringPaymentLedger.builder()
                .payment(collectionLedger.getPayment())
                .request(request)
                .task(collectionLedger.getTask())
                .deal(collectionLedger.getDeal())
                .student(request.getStudent())
                .mentor(collectionLedger.getMentor())
                .amount(collectionLedger.getAmount())
                .transactionType(MentoringLedgerTransactionType.REFUND)
                .status(result.getStatus())
                .providerReference(result.getProviderReference())
                .deadlineSnapshot(collectionLedger.getDeadlineSnapshot())
                .note(reason != null && !reason.isBlank() ? reason : result.getMessage())
                .build();

        MentoringPaymentLedger savedLedger = ledgerRepository.save(refundLedger);
        log.info("Đã ghi nhận giao dịch Refund vào Sổ quỹ: ledgerId={}, status={}, ref={}",
                savedLedger.getId(), savedLedger.getStatus(), savedLedger.getProviderReference());

        return savedLedger;
    }
}
