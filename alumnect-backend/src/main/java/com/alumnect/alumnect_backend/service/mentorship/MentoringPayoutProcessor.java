package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementCommand;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementResult;
import com.alumnect.alumnect_backend.integration.disbursement.MentoringDisbursementGateway;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Xử lý từng lệnh chi tiền (PAYOUT cho Mentor, REFUND cho Học viên) trong một transaction riêng, có khóa dòng ledger.
 * <p>
 * Trạng thái {@code providerStatus} của ledger PENDING chưa có payoutId PayOS:
 * <ul>
 *   <li>QUEUED – chờ gửi PayOS.</li>
 *   <li>BANK_ACCOUNT_REQUIRED – người nhận chưa có/sai tài khoản nhận tiền; tự gửi lại khi người nhận cập nhật.</li>
 *   <li>PROVIDER_UNAVAILABLE – PayOS chưa tiếp nhận (key sai, IP chưa whitelist, rate limit); tự gửi lại.</li>
 *   <li>SUBMIT_UNKNOWN – timeout/5xx; tra cứu theo referenceId trước khi gửi lại cùng idempotency key.</li>
 * </ul>
 * Khi đã có payoutId, ledger được đồng bộ trạng thái từ PayOS tới khi SUCCEEDED/FAILED.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MentoringPayoutProcessor {

    static final String QUEUED = "QUEUED";
    static final String BANK_ACCOUNT_REQUIRED = "BANK_ACCOUNT_REQUIRED";
    static final String PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE";
    static final String SUBMIT_UNKNOWN = "SUBMIT_UNKNOWN";
    static final String REJECTED = "REJECTED";
    static final String BELOW_MINIMUM = "BELOW_MINIMUM";

    private static final Pattern RETRY_SUFFIX = Pattern.compile("^(.*)-R(\\d+)$");

    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorPayoutAccountRepository payoutAccountRepository;
    private final RefundAccountResolver refundAccountResolver;
    private final MentoringDisbursementGateway disbursementGateway;
    private final NotificationService notificationService;

    /** Số tiền tối thiểu của một lệnh chi qua PayOS Kênh chi */
    @Value("${app.disbursement.min-amount:2000}")
    private long minPayoutAmount;

    /** Tài khoản nhận tiền của người thụ hưởng (Mentor nhận thù lao hoặc Học viên nhận hoàn tiền) */
    private record Beneficiary(User user, String bankName, String bankBin, String accountNumber, String accountHolder) {}

    /**
     * Gửi lệnh chi sang PayOS hoặc đồng bộ trạng thái nếu đã gửi. An toàn khi gọi lặp lại.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MentoringPaymentLedger dispatch(Long ledgerId) {
        MentoringPaymentLedger ledger = ledgerRepository.findByIdForUpdate(ledgerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lệnh chi với ID: " + ledgerId));
        if (!isDisbursement(ledger) || ledger.getStatus() != MentoringLedgerStatus.PENDING) {
            return ledger;
        }

        if (hasText(ledger.getProviderReference())) {
            applyResult(ledger, disbursementGateway.checkDisbursementStatus(ledger.getProviderReference()));
            return save(ledger);
        }

        if (SUBMIT_UNKNOWN.equals(ledger.getProviderStatus())) {
            Optional<DisbursementResult> accepted = disbursementGateway.findPayoutByReferenceId(ledger.getIdempotencyKey());
            if (accepted.isPresent()) {
                log.info("Khôi phục lệnh chi đã được PayOS tiếp nhận: ledgerId={}, payoutId={}",
                        ledger.getId(), accepted.get().getProviderReference());
                applyResult(ledger, accepted.get());
                return save(ledger);
            }
        }

        if (ledger.getAmount().compareTo(BigDecimal.valueOf(minPayoutAmount)) < 0) {
            ledger.setStatus(MentoringLedgerStatus.FAILED);
            ledger.setProviderStatus(BELOW_MINIMUM);
            ledger.setNote("Số tiền nhỏ hơn mức chi tối thiểu qua PayOS (" + MentoringRules.formatVnd(BigDecimal.valueOf(minPayoutAmount))
                    + "). Admin cần chuyển khoản thủ công.");
            return save(ledger);
        }

        Optional<Beneficiary> beneficiary = findBeneficiary(ledger);
        if (beneficiary.isEmpty()) {
            ledger.setProviderStatus(BANK_ACCOUNT_REQUIRED);
            boolean refund = ledger.getTransactionType() == MentoringLedgerTransactionType.REFUND;
            ledger.setNote(refund
                    ? "Chờ Học viên cập nhật tài khoản nhận hoàn tiền."
                    : "Chờ Mentor cập nhật tài khoản nhận tiền hợp lệ (ngân hàng, số tài khoản).");
            User recipient = refund ? ledger.getStudent() : ledger.getMentor();
            notificationService.sendMentoringAccountNotification(null, recipient,
                    refund ? "MENTORING_REFUND" : "MENTOR_PAYOUT", ledger.getId() + ":ACCOUNT_REQUIRED",
                    refund ? "Cần tài khoản nhận hoàn tiền" : "Cần tài khoản nhận thù lao",
                    "Bạn có khoản " + MentoringRules.formatVnd(ledger.getAmount())
                            + " đang chờ chuyển. Vui lòng cập nhật tài khoản ngân hàng để hệ thống chi trả.");
            return save(ledger);
        }

        submit(ledger, beneficiary.get());
        return save(ledger);
    }

    /**
     * Mở lại lệnh chi FAILED với idempotency key mới (PayOS coi là lệnh chi mới).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetForRetry(Long ledgerId, String note) {
        MentoringPaymentLedger ledger = ledgerRepository.findByIdForUpdate(ledgerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lệnh chi với ID: " + ledgerId));
        if (!isDisbursement(ledger)) {
            throw new ConflictException("Chỉ có thể chi lại giao dịch loại PAYOUT hoặc REFUND.");
        }
        if (ledger.getStatus() != MentoringLedgerStatus.FAILED) {
            throw new ConflictException("Chỉ có thể chi lại lệnh chi đang ở trạng thái FAILED.");
        }
        ledger.setIdempotencyKey(nextRetryKey(ledger.getIdempotencyKey(), ledger));
        ledger.setStatus(MentoringLedgerStatus.PENDING);
        ledger.setProviderStatus(QUEUED);
        ledger.setProviderReference(null);
        ledger.setProviderTransactionId(null);
        ledger.setFailureCode(null);
        ledger.setTransactedAt(null);
        ledger.setNote(hasText(note) ? note.trim() : "Admin yêu cầu chi lại.");
        ledgerRepository.save(ledger);
    }

    private void submit(MentoringPaymentLedger ledger, Beneficiary beneficiary) {
        Long taskId = ledger.getTask() != null ? ledger.getTask().getId() : null;
        boolean refund = ledger.getTransactionType() == MentoringLedgerTransactionType.REFUND;
        String reference = taskId != null ? "TASK " + taskId : "LEDGER " + ledger.getId();
        DisbursementCommand command = DisbursementCommand.builder()
                .taskId(taskId)
                .requestId(ledger.getRequest() != null ? ledger.getRequest().getId() : null)
                .dealId(ledger.getDeal() != null ? ledger.getDeal().getId() : null)
                .beneficiaryUserId(beneficiary.user().getId())
                .amount(ledger.getAmount())
                .bankName(beneficiary.bankName())
                .bankBin(beneficiary.bankBin())
                .bankAccountNumber(beneficiary.accountNumber())
                .bankAccountHolder(beneficiary.accountHolder())
                .description(refund ? "ALUMNECT HOAN TIEN " + reference : "ALUMNECT " + reference)
                .category(refund ? "refund" : "commission")
                .idempotencyKey(ledger.getIdempotencyKey())
                .build();

        try {
            applyResult(ledger, disbursementGateway.processPayout(command));
        } catch (DisbursementException ex) {
            ledger.setFailureCode(ex.getErrorCode());
            switch (ex.getKind()) {
                case REJECTED -> {
                    ledger.setStatus(MentoringLedgerStatus.FAILED);
                    ledger.setProviderStatus(REJECTED);
                    ledger.setNote("PayOS từ chối lệnh chi: " + safeMessage(ex));
                }
                case NOT_SUBMITTED -> {
                    ledger.setProviderStatus(PROVIDER_UNAVAILABLE);
                    ledger.setNote("PayOS chưa tiếp nhận lệnh chi, hệ thống sẽ tự gửi lại: " + safeMessage(ex));
                }
                case UNKNOWN -> {
                    // PayOS có thể đã nhận lệnh: lần sau tra cứu theo referenceId rồi mới gửi lại cùng key.
                    ledger.setProviderStatus(SUBMIT_UNKNOWN);
                    ledger.setNote("Chưa xác định kết quả gửi PayOS: " + safeMessage(ex));
                }
            }
            log.warn("Lệnh chi ledgerId={} gặp lỗi {}: {}", ledger.getId(), ex.getKind(), safeMessage(ex));
        } catch (RuntimeException ex) {
            // Dữ liệu lệnh chi không hợp lệ (số tiền lẻ, thiếu key...) – không gửi được, cần Admin xử lý.
            ledger.setStatus(MentoringLedgerStatus.FAILED);
            ledger.setProviderStatus("INVALID_REQUEST");
            ledger.setNote("Lệnh chi không hợp lệ: " + safeMessage(ex));
            log.error("Lệnh chi ledgerId={} không hợp lệ: {}", ledger.getId(), safeMessage(ex));
        }
    }

    private Optional<Beneficiary> findBeneficiary(MentoringPaymentLedger ledger) {
        if (ledger.getTransactionType() == MentoringLedgerTransactionType.REFUND) {
            User student = ledger.getStudent();
            return refundAccountResolver.find(student.getId())
                    .filter(a -> isValidAccount(a.getBankBin(), a.getBankAccountNumber()))
                    .map(a -> new Beneficiary(student, a.getBankName(), a.getBankBin(), a.getBankAccountNumber(), a.getBankAccountHolder()));
        }
        User mentor = ledger.getMentor();
        return mentorProfileRepository.findByUserId(mentor.getId())
                .flatMap(profile -> payoutAccountRepository.findByMentorProfileId(profile.getId()))
                .filter(a -> isValidAccount(a.getBankBin(), a.getBankAccountNumber()))
                .map(a -> new Beneficiary(mentor, a.getBankName(), a.getBankBin(), a.getBankAccountNumber(), a.getBankAccountHolder()));
    }

    private boolean isValidAccount(String bankBin, String accountNumber) {
        return hasText(bankBin) && bankBin.matches("\\d{6}") && hasText(accountNumber) && accountNumber.matches("\\d{6,30}");
    }

    /** Lưu ledger và báo cho người nhận khi lệnh chi có kết quả cuối cùng. */
    private MentoringPaymentLedger save(MentoringPaymentLedger ledger) {
        MentoringPaymentLedger saved = ledgerRepository.save(ledger);
        if (saved.getStatus() == MentoringLedgerStatus.SUCCEEDED || saved.getStatus() == MentoringLedgerStatus.FAILED) {
            boolean refund = saved.getTransactionType() == MentoringLedgerTransactionType.REFUND;
            User recipient = refund ? saved.getStudent() : saved.getMentor();
            String amount = MentoringRules.formatVnd(saved.getAmount());
            String taskLabel = saved.getTask() != null ? " của Task #" + saved.getTask().getId() : "";
            boolean ok = saved.getStatus() == MentoringLedgerStatus.SUCCEEDED;
            notificationService.sendMentoringAccountNotification(null, recipient,
                    refund ? "MENTORING_REFUND" : "MENTOR_PAYOUT",
                    saved.getId() + ":" + saved.getStatus() + ":" + saved.getIdempotencyKey(),
                    ok ? (refund ? "Đã hoàn tiền" : "Đã chi trả thù lao") : (refund ? "Hoàn tiền chưa thành công" : "Chi trả thù lao chưa thành công"),
                    ok ? "Khoản " + amount + taskLabel + " đã được chuyển vào tài khoản của bạn."
                       : "Khoản " + amount + taskLabel + " chưa chuyển được. Ban Quản Trị sẽ kiểm tra và xử lý lại.");
        }
        return saved;
    }

    private boolean isDisbursement(MentoringPaymentLedger ledger) {
        return ledger.getTransactionType() == MentoringLedgerTransactionType.PAYOUT
                || ledger.getTransactionType() == MentoringLedgerTransactionType.REFUND;
    }

    private void applyResult(MentoringPaymentLedger ledger, DisbursementResult result) {
        ledger.setStatus(result.getStatus());
        ledger.setProviderReference(result.getProviderReference());
        ledger.setProviderTransactionId(result.getProviderTransactionId());
        ledger.setProviderStatus(result.getProviderStatus());
        ledger.setFailureCode(result.getFailureCode());
        ledger.setTransactedAt(result.getTransactedAt());
        if (hasText(result.getMessage())) ledger.setNote(result.getMessage());
    }

    private String nextRetryKey(String currentKey, MentoringPaymentLedger ledger) {
        String base = hasText(currentKey) ? currentKey
                : "ALUMNECT-" + ledger.getTransactionType() + "-LEDGER-" + ledger.getId();
        Matcher matcher = RETRY_SUFFIX.matcher(base);
        if (matcher.matches()) {
            return matcher.group(1) + "-R" + (Integer.parseInt(matcher.group(2)) + 1);
        }
        return base + "-R1";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String safeMessage(Exception ex) {
        String message = ex.getMessage();
        if (!hasText(message)) return ex.getClass().getSimpleName();
        return message.length() <= 300 ? message : message.substring(0, 300);
    }
}
