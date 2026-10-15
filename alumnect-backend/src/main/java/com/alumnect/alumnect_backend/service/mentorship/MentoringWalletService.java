package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserRefundAccountRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.RefundAccountRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWalletItemResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWalletResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.RefundAccountResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.UserRefundAccount;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Ví Mentoring: thu nhập và lịch sử chi trả của Mentor, khoản hoàn tiền và tài khoản nhận hoàn tiền của Học viên.
 */
@Service
@RequiredArgsConstructor
public class MentoringWalletService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final UserRefundAccountRepository refundAccountRepository;
    private final MentoringDisbursementService disbursementService;

    @Transactional(readOnly = true)
    public MentoringWalletResponse getMentorEarnings(String email) {
        User user = requireUser(email);
        return summarize(ledgerRepository.findByMentorIdAndTransactionTypeOrderByCreatedAtDesc(
                user.getId(), MentoringLedgerTransactionType.PAYOUT), false);
    }

    @Transactional(readOnly = true)
    public MentoringWalletResponse getMyRefunds(String email) {
        User user = requireUser(email);
        return summarize(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(
                user.getId(), MentoringLedgerTransactionType.REFUND), true);
    }

    @Transactional(readOnly = true)
    public RefundAccountResponse getRefundAccount(String email) {
        User user = requireUser(email);
        return refundAccountRepository.findByUserId(user.getId()).map(this::toResponse).orElse(null);
    }

    @Transactional
    public RefundAccountResponse saveRefundAccount(String email, RefundAccountRequest request) {
        User user = requireUser(email);
        UserRefundAccount account = refundAccountRepository.findByUserId(user.getId())
                .orElseGet(() -> UserRefundAccount.builder().user(user).build());
        account.setBankName(request.getBankName().trim());
        account.setBankBin(request.getBankBin().trim());
        account.setBankAccountNumber(request.getBankAccountNumber().trim());
        account.setBankAccountHolder(request.getBankAccountHolder().trim().toUpperCase());
        account.setUpdatedAt(Instant.now());
        UserRefundAccount saved = refundAccountRepository.save(account);

        // Gửi ngay các khoản hoàn tiền đang chờ tài khoản (không đợi job định kỳ)
        ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(user.getId(), MentoringLedgerTransactionType.REFUND)
                .stream()
                .filter(l -> l.getStatus() == MentoringLedgerStatus.PENDING && l.getProviderReference() == null)
                .forEach(l -> disbursementService.dispatchPayoutAfterCommit(l.getId()));
        return toResponse(saved);
    }

    private MentoringWalletResponse summarize(List<MentoringPaymentLedger> ledgers, boolean refund) {
        BigDecimal received = BigDecimal.ZERO;
        BigDecimal processing = BigDecimal.ZERO;
        BigDecimal failed = BigDecimal.ZERO;
        boolean accountRequired = false;
        for (MentoringPaymentLedger l : ledgers) {
            switch (l.getStatus()) {
                case SUCCEEDED -> received = received.add(l.getAmount());
                case PENDING -> processing = processing.add(l.getAmount());
                case FAILED -> failed = failed.add(l.getAmount());
            }
            if (l.getStatus() == MentoringLedgerStatus.PENDING
                    && MentoringPayoutProcessor.BANK_ACCOUNT_REQUIRED.equals(l.getProviderStatus())) {
                accountRequired = true;
            }
        }
        List<MentoringWalletItemResponse> items = ledgers.stream().map(l -> MentoringWalletItemResponse.builder()
                .ledgerId(l.getId())
                .taskId(l.getTask() != null ? l.getTask().getId() : null)
                .taskTitle(l.getTask() != null ? l.getTask().getTaskTitle() : null)
                .counterpartName(displayName(refund ? l.getMentor() : l.getStudent()))
                .amount(l.getAmount())
                .status(l.getStatus())
                .providerStatus(l.getProviderStatus())
                .note(l.getNote())
                .transactedAt(l.getTransactedAt())
                .createdAt(l.getCreatedAt())
                .build()).toList();
        return MentoringWalletResponse.builder()
                .totalReceived(received)
                .totalProcessing(processing)
                .totalFailed(failed)
                .bankAccountRequired(accountRequired)
                .items(items)
                .build();
    }

    private RefundAccountResponse toResponse(UserRefundAccount a) {
        return RefundAccountResponse.builder()
                .bankName(a.getBankName())
                .bankBin(a.getBankBin())
                .bankAccountNumber(a.getBankAccountNumber())
                .bankAccountHolder(a.getBankAccountHolder())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private String displayName(User user) {
        if (user == null) return null;
        UserProfile p = userProfileRepository.findById(user.getId()).orElse(null);
        return p != null && p.getFullName() != null ? p.getFullName() : user.getEmail();
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }
}
