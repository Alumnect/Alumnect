package com.alumnect.alumnect_backend.integration.disbursement;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import vn.payos.PayOS;
import vn.payos.exception.APIException;
import vn.payos.model.v1.payouts.GetPayoutListParams;
import vn.payos.model.v1.payouts.Payout;
import vn.payos.model.v1.payouts.PayoutApprovalState;
import vn.payos.model.v1.payouts.PayoutRequests;
import vn.payos.model.v1.payouts.PayoutTransaction;
import vn.payos.model.v1.payouts.PayoutTransactionState;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/** Adapter Kênh chi PayOS thật dành riêng cho payout thù lao Mentor. */
@Slf4j
@Component
public class PayOSMentoringDisbursementGatewayImpl implements MentoringDisbursementGateway {

    /** HTTP status chắc chắn PayOS chưa tiếp nhận lệnh: key sai, IP chưa whitelist, rate limit. */
    private static final Set<Integer> NOT_SUBMITTED_STATUSES = Set.of(401, 403, 429);

    private static final Set<PayoutApprovalState> FAILED_APPROVAL_STATES =
            Set.of(PayoutApprovalState.REJECTED, PayoutApprovalState.CANCELLED, PayoutApprovalState.FAILED);

    private static final Set<PayoutTransactionState> FAILED_TRANSACTION_STATES =
            Set.of(PayoutTransactionState.FAILED, PayoutTransactionState.CANCELLED, PayoutTransactionState.REVERSED);

    private final PayOS payOS;

    public PayOSMentoringDisbursementGatewayImpl(@Qualifier("payoutPayOS") PayOS payOS) {
        this.payOS = payOS;
    }

    @Override
    public DisbursementResult processPayout(DisbursementCommand command) {
        validate(command);
        PayoutRequests request = PayoutRequests.builder()
                .referenceId(command.getIdempotencyKey())
                .amount(command.getAmount().setScale(0, RoundingMode.UNNECESSARY).longValueExact())
                .description(normalizeDescription(command.getDescription()))
                .toBin(command.getBankBin())
                .toAccountNumber(command.getBankAccountNumber())
                .category(List.of(command.getCategory() != null ? command.getCategory() : "commission"))
                .build();

        log.info("Gửi payout PayOS: taskId={}, mentorId={}, amount={}, bankBin={}, referenceId={}",
                command.getTaskId(), command.getBeneficiaryUserId(), command.getAmount(),
                command.getBankBin(), command.getIdempotencyKey());
        try {
            return map(payOS.payouts().create(request, command.getIdempotencyKey()));
        } catch (RuntimeException ex) {
            throw classify(ex);
        }
    }

    @Override
    public DisbursementResult processRefund(DisbursementCommand command) {
        throw new BadRequestException("Hoàn tiền PayOS cần tài khoản thụ hưởng của học viên và được xử lý ở luồng riêng.");
    }

    @Override
    public DisbursementResult checkDisbursementStatus(String providerReference) {
        if (providerReference == null || providerReference.isBlank()) {
            throw new BadRequestException("Thiếu payoutId PayOS để tra cứu trạng thái.");
        }
        return map(payOS.payouts().get(providerReference));
    }

    @Override
    public Optional<DisbursementResult> findPayoutByReferenceId(String referenceId) {
        List<Payout> payouts = payOS.payouts()
                .list(GetPayoutListParams.builder().referenceId(referenceId).limit(1).build())
                .getItems();
        return payouts == null || payouts.isEmpty() ? Optional.empty() : Optional.of(map(payouts.get(0)));
    }

    @Override
    public BigDecimal getPayoutBalance() {
        try {
            return new BigDecimal(payOS.payoutsAccount().balance().getBalance());
        } catch (RuntimeException ex) {
            throw classify(ex);
        }
    }

    private void validate(DisbursementCommand command) {
        if (command.getIdempotencyKey() == null || command.getIdempotencyKey().isBlank()) {
            throw new BadRequestException("Thiếu idempotency key của lệnh chi.");
        }
        if (command.getAmount() == null || command.getAmount().signum() <= 0) {
            throw new BadRequestException("Số tiền chi trả phải lớn hơn 0.");
        }
        if (command.getBankBin() == null || !command.getBankBin().matches("\\d{6}")) {
            throw new BadRequestException("Mã BIN ngân hàng thụ hưởng không hợp lệ.");
        }
        if (command.getBankAccountNumber() == null || command.getBankAccountNumber().isBlank()) {
            throw new BadRequestException("Thiếu số tài khoản ngân hàng thụ hưởng.");
        }
    }

    private String normalizeDescription(String description) {
        String value = description == null ? "ALUMNECT PAYOUT" : description.trim();
        return value.length() <= 100 ? value : value.substring(0, 100);
    }

    private DisbursementException classify(RuntimeException ex) {
        if (ex instanceof APIException apiEx) {
            int status = apiEx.getStatusCode().orElse(0);
            String code = apiEx.getErrorCode().orElse(status > 0 ? String.valueOf(status) : null);
            String desc = apiEx.getErrorDesc().orElse(ex.getMessage());
            if (NOT_SUBMITTED_STATUSES.contains(status)) {
                return new DisbursementException(DisbursementException.Kind.NOT_SUBMITTED, code, desc, ex);
            }
            if (status >= 500) {
                return new DisbursementException(DisbursementException.Kind.UNKNOWN, code, desc, ex);
            }
            return new DisbursementException(DisbursementException.Kind.REJECTED, code, desc, ex);
        }
        // Lỗi kết nối, timeout, sai chữ ký phản hồi: PayOS có thể đã tiếp nhận lệnh.
        return new DisbursementException(DisbursementException.Kind.UNKNOWN, null, ex.getMessage(), ex);
    }

    private DisbursementResult map(Payout payout) {
        List<PayoutTransaction> transactions = payout.getTransactions() == null ? List.of() : payout.getTransactions();
        PayoutTransaction transaction = transactions.isEmpty() ? null : transactions.get(0);
        PayoutTransactionState state = transaction != null ? transaction.getState() : null;
        PayoutApprovalState approvalState = payout.getApprovalState();

        MentoringLedgerStatus status;
        if (state == PayoutTransactionState.SUCCEEDED
                || (state == null && approvalState == PayoutApprovalState.COMPLETED)) {
            status = MentoringLedgerStatus.SUCCEEDED;
        } else if ((state != null && FAILED_TRANSACTION_STATES.contains(state))
                || (approvalState != null && FAILED_APPROVAL_STATES.contains(approvalState))) {
            status = MentoringLedgerStatus.FAILED;
        } else {
            status = MentoringLedgerStatus.PENDING;
        }

        String providerStatus = state != null ? state.getValue()
                : approvalState != null ? approvalState.getValue() : "PROCESSING";
        String message = transaction != null && transaction.getErrorMessage() != null
                ? transaction.getErrorMessage()
                : switch (status) {
                    case SUCCEEDED -> "PayOS đã chi trả thành công";
                    case FAILED -> "PayOS từ chối hoặc hủy lệnh chi (" + providerStatus + ")";
                    default -> "PayOS đang xử lý lệnh chi";
                };

        return DisbursementResult.builder()
                .providerReference(payout.getId())
                .providerTransactionId(transaction != null ? transaction.getId() : null)
                .providerStatus(providerStatus)
                .failureCode(transaction != null ? transaction.getErrorCode() : null)
                .status(status)
                .message(message)
                .transactedAt(status == MentoringLedgerStatus.SUCCEEDED ? Instant.now() : null)
                .build();
    }
}
