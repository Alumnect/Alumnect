package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserRefundAccountRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.RefundAccountRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWalletResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.RefundAccountResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.UserRefundAccount;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementCommand;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementResult;
import com.alumnect.alumnect_backend.integration.disbursement.MentoringDisbursementGateway;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDisbursementService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringPayoutProcessor;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWalletService;
import com.alumnect.alumnect_backend.service.mentorship.RefundAccountResolver;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-65 Mentoring - Earnings, Refunds &amp; Refund Account.
 * Report sheet : FE-65 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringWalletService.getMentorEarnings(), getMyRefunds(), getRefundAccount(), saveRefundAccount(),
 *                RefundAccountResolver.find(), MentoringPayoutProcessor.dispatch(), resetForRetry()
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FE-65 Mentoring - Earnings, Refunds & Refund Account")
class FE65_MentoringEarningsRefundsTest {

    // ===== Mocks =====
    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private MentoringPaymentLedgerRepository ledgerRepository;
    @Mock private UserRefundAccountRepository refundAccountRepository;
    @Mock private RefundAccountResolver refundAccountResolver;
    @Mock private MentoringDisbursementService disbursementService;
    @Mock private MentorProfileRepository mentorProfileRepository;
    @Mock private MentorPayoutAccountRepository payoutAccountRepository;
    @Mock private MentoringDisbursementGateway gateway;
    @Mock private NotificationService notificationService;

    // ===== Systems under test =====
    private MentoringWalletService walletService;
    private MentoringPayoutProcessor processor;

    // ===== Test data =====
    private static final String EMAIL = "user@fpt.edu.vn";
    private static final String GHOST_EMAIL = "ghost@fpt.edu.vn";

    private User mentor;
    private User student;
    private MentoringPaymentLedger ledger;

    @BeforeEach
    void setUp() {
        walletService = new MentoringWalletService(userRepository, userProfileRepository, ledgerRepository,
                refundAccountRepository, refundAccountResolver, disbursementService);
        processor = new MentoringPayoutProcessor(ledgerRepository, mentorProfileRepository, payoutAccountRepository,
                refundAccountResolver, gateway, notificationService);

        mentor = User.builder().id(7L).email("mentor@fpt.edu.vn").build();
        student = User.builder().id(5L).email("student@fpt.edu.vn").build();

        MentoringTask task = new MentoringTask();
        task.setId(42L);
        ledger = MentoringPaymentLedger.builder()
                .id(100L).task(task).mentor(mentor).amount(new BigDecimal("500000.00"))
                .transactionType(MentoringLedgerTransactionType.PAYOUT)
                .status(MentoringLedgerStatus.PENDING)
                .providerStatus("QUEUED")
                .idempotencyKey("ALUMNECT-PAYOUT-TASK-42")
                .build();
        when(ledgerRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(ledger));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private MentoringPaymentLedger entry(Long id, User m, User s, String amount, MentoringLedgerStatus status,
                                         MentoringLedgerTransactionType type, String providerStatus) {
        return MentoringPaymentLedger.builder().id(id).mentor(m).student(s).amount(new BigDecimal(amount))
                .status(status).transactionType(type).providerStatus(providerStatus).build();
    }

    // ================= getMentorEarnings() =================

    @Test
    @DisplayName("UTCID01 - Mentor with SUCCEEDED 500000, PENDING 200000, FAILED 100000 -> totals and 3 items")
    void utcid01_getMentorEarnings_ok() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(mentor));
        when(userProfileRepository.findById(5L)).thenReturn(Optional.of(UserProfile.builder().userId(5L).fullName("Student A").build()));
        when(ledgerRepository.findByMentorIdAndTransactionTypeOrderByCreatedAtDesc(7L, MentoringLedgerTransactionType.PAYOUT))
                .thenReturn(List.of(
                        entry(1L, mentor, student, "500000", MentoringLedgerStatus.SUCCEEDED, MentoringLedgerTransactionType.PAYOUT, "SUCCEEDED"),
                        entry(2L, mentor, student, "200000", MentoringLedgerStatus.PENDING, MentoringLedgerTransactionType.PAYOUT, "PROCESSING"),
                        entry(3L, mentor, student, "100000", MentoringLedgerStatus.FAILED, MentoringLedgerTransactionType.PAYOUT, "REJECTED")));

        MentoringWalletResponse result = walletService.getMentorEarnings(EMAIL);

        assertThat(result.getTotalReceived()).isEqualByComparingTo("500000");
        assertThat(result.getTotalProcessing()).isEqualByComparingTo("200000");
        assertThat(result.getTotalFailed()).isEqualByComparingTo("100000");
        assertThat(result.isBankAccountRequired()).isFalse();
        assertThat(result.getItems()).hasSize(3);
        assertThat(result.getItems().get(0).getCounterpartName()).isEqualTo("Student A");
    }

    @Test
    @DisplayName("UTCID02 - Mentor without PAYOUT ledger -> all totals 0 and empty items")
    void utcid02_getMentorEarnings_empty() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(mentor));
        when(ledgerRepository.findByMentorIdAndTransactionTypeOrderByCreatedAtDesc(7L, MentoringLedgerTransactionType.PAYOUT))
                .thenReturn(List.of());

        MentoringWalletResponse result = walletService.getMentorEarnings(EMAIL);

        assertThat(result.getTotalReceived()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalProcessing()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalFailed()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.isBankAccountRequired()).isFalse();
        assertThat(result.getItems()).isEmpty();
    }

    @Test
    @DisplayName("UTCID03 - PENDING payout with BANK_ACCOUNT_REQUIRED -> bankAccountRequired = true")
    void utcid03_getMentorEarnings_bankAccountRequired() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(mentor));
        when(ledgerRepository.findByMentorIdAndTransactionTypeOrderByCreatedAtDesc(7L, MentoringLedgerTransactionType.PAYOUT))
                .thenReturn(List.of(entry(2L, mentor, student, "200000", MentoringLedgerStatus.PENDING,
                        MentoringLedgerTransactionType.PAYOUT, "BANK_ACCOUNT_REQUIRED")));

        MentoringWalletResponse result = walletService.getMentorEarnings(EMAIL);

        assertThat(result.isBankAccountRequired()).isTrue();
        assertThat(result.getTotalProcessing()).isEqualByComparingTo("200000");
    }

    @Test
    @DisplayName("UTCID04 - Unknown email -> ResourceNotFoundException")
    void utcid04_getMentorEarnings_userNotFound() {
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walletService.getMentorEarnings(GHOST_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng");
    }

    // ================= getMyRefunds() =================

    @Test
    @DisplayName("UTCID05 - Student with SUCCEEDED 300000 and PENDING 150000 refunds -> totals and Mentor name")
    void utcid05_getMyRefunds_ok() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(userProfileRepository.findById(7L)).thenReturn(Optional.of(UserProfile.builder().userId(7L).fullName("Mentor B").build()));
        when(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(5L, MentoringLedgerTransactionType.REFUND))
                .thenReturn(List.of(
                        entry(1L, mentor, student, "300000", MentoringLedgerStatus.SUCCEEDED, MentoringLedgerTransactionType.REFUND, "SUCCEEDED"),
                        entry(2L, mentor, student, "150000", MentoringLedgerStatus.PENDING, MentoringLedgerTransactionType.REFUND, "PROCESSING")));

        MentoringWalletResponse result = walletService.getMyRefunds(EMAIL);

        assertThat(result.getTotalReceived()).isEqualByComparingTo("300000");
        assertThat(result.getTotalProcessing()).isEqualByComparingTo("150000");
        assertThat(result.getTotalFailed()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getItems().get(0).getCounterpartName()).isEqualTo("Mentor B");
    }

    @Test
    @DisplayName("UTCID06 - Student without REFUND ledger -> all totals 0 and empty items")
    void utcid06_getMyRefunds_empty() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(5L, MentoringLedgerTransactionType.REFUND))
                .thenReturn(List.of());

        MentoringWalletResponse result = walletService.getMyRefunds(EMAIL);

        assertThat(result.getTotalReceived()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalProcessing()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalFailed()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.isBankAccountRequired()).isFalse();
        assertThat(result.getItems()).isEmpty();
    }

    @Test
    @DisplayName("UTCID07 - PENDING refund with BANK_ACCOUNT_REQUIRED -> bankAccountRequired = true")
    void utcid07_getMyRefunds_bankAccountRequired() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(5L, MentoringLedgerTransactionType.REFUND))
                .thenReturn(List.of(entry(2L, mentor, student, "150000", MentoringLedgerStatus.PENDING,
                        MentoringLedgerTransactionType.REFUND, "BANK_ACCOUNT_REQUIRED")));

        MentoringWalletResponse result = walletService.getMyRefunds(EMAIL);

        assertThat(result.isBankAccountRequired()).isTrue();
        assertThat(result.getTotalProcessing()).isEqualByComparingTo("150000");
    }

    @Test
    @DisplayName("UTCID08 - Unknown email -> ResourceNotFoundException")
    void utcid08_getMyRefunds_userNotFound() {
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walletService.getMyRefunds(GHOST_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng");
    }

    // ================= getRefundAccount() =================

    @Test
    @DisplayName("UTCID09 - Declared refund account -> RefundAccountResponse with all fields")
    void utcid09_getRefundAccount_ok() {
        UserRefundAccount account = UserRefundAccount.builder().user(student).bankName("VCB").bankBin("970436")
                .bankAccountNumber("0123456789").bankAccountHolder("NGUYEN VAN A").build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(refundAccountResolver.find(5L)).thenReturn(Optional.of(account));

        RefundAccountResponse result = walletService.getRefundAccount(EMAIL);

        assertThat(result.getBankName()).isEqualTo("VCB");
        assertThat(result.getBankBin()).isEqualTo("970436");
        assertThat(result.getBankAccountNumber()).isEqualTo("0123456789");
        assertThat(result.getBankAccountHolder()).isEqualTo("NGUYEN VAN A");
    }

    @Test
    @DisplayName("UTCID10 - No declared account and no Mentor payout account -> null")
    void utcid10_getRefundAccount_none() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(refundAccountResolver.find(5L)).thenReturn(Optional.empty());

        assertThat(walletService.getRefundAccount(EMAIL)).isNull();
    }

    @Test
    @DisplayName("UTCID11 - Unknown email -> ResourceNotFoundException")
    void utcid11_getRefundAccount_userNotFound() {
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walletService.getRefundAccount(GHOST_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng");
    }

    // ================= saveRefundAccount() =================

    private RefundAccountRequest request(String name, String bin, String number, String holder) {
        return RefundAccountRequest.builder().bankName(name).bankBin(bin).bankAccountNumber(number).bankAccountHolder(holder).build();
    }

    @Test
    @DisplayName("UTCID12 - New account with padded values -> saved trimmed and holder upper-cased")
    void utcid12_saveRefundAccount_newAccount() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(refundAccountRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(refundAccountRepository.save(any(UserRefundAccount.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(5L, MentoringLedgerTransactionType.REFUND))
                .thenReturn(List.of());

        RefundAccountResponse result = walletService.saveRefundAccount(EMAIL,
                request(" Vietcombank ", " 970436 ", " 0123456789 ", " nguyen van a "));

        ArgumentCaptor<UserRefundAccount> saved = ArgumentCaptor.forClass(UserRefundAccount.class);
        verify(refundAccountRepository).save(saved.capture());
        assertThat(saved.getValue().getUser()).isSameAs(student);
        assertThat(saved.getValue().getBankName()).isEqualTo("Vietcombank");
        assertThat(saved.getValue().getBankBin()).isEqualTo("970436");
        assertThat(saved.getValue().getBankAccountNumber()).isEqualTo("0123456789");
        assertThat(saved.getValue().getBankAccountHolder()).isEqualTo("NGUYEN VAN A");
        assertThat(result.getBankAccountHolder()).isEqualTo("NGUYEN VAN A");
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("UTCID13 - Existing account -> the same record is updated")
    void utcid13_saveRefundAccount_updateExisting() {
        UserRefundAccount existing = UserRefundAccount.builder().id(1L).user(student).bankName("OLD").bankBin("970415")
                .bankAccountNumber("111111").bankAccountHolder("OLD HOLDER").build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(refundAccountRepository.findByUserId(5L)).thenReturn(Optional.of(existing));
        when(refundAccountRepository.save(any(UserRefundAccount.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(5L, MentoringLedgerTransactionType.REFUND))
                .thenReturn(List.of());

        walletService.saveRefundAccount(EMAIL, request("ACB", "970416", "24710327", "pham trung hieu"));

        ArgumentCaptor<UserRefundAccount> saved = ArgumentCaptor.forClass(UserRefundAccount.class);
        verify(refundAccountRepository).save(saved.capture());
        assertThat(saved.getValue()).isSameAs(existing);
        assertThat(existing.getBankName()).isEqualTo("ACB");
        assertThat(existing.getBankBin()).isEqualTo("970416");
        assertThat(existing.getBankAccountHolder()).isEqualTo("PHAM TRUNG HIEU");
    }

    @Test
    @DisplayName("UTCID14 - Waiting refunds without providerReference are dispatched immediately")
    void utcid14_saveRefundAccount_dispatchesWaitingRefunds() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        when(refundAccountRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(refundAccountRepository.save(any(UserRefundAccount.class))).thenAnswer(inv -> inv.getArgument(0));
        MentoringPaymentLedger waiting1 = entry(11L, mentor, student, "100000", MentoringLedgerStatus.PENDING, MentoringLedgerTransactionType.REFUND, "BANK_ACCOUNT_REQUIRED");
        MentoringPaymentLedger waiting2 = entry(12L, mentor, student, "100000", MentoringLedgerStatus.PENDING, MentoringLedgerTransactionType.REFUND, "BANK_ACCOUNT_REQUIRED");
        MentoringPaymentLedger submitted = entry(13L, mentor, student, "100000", MentoringLedgerStatus.PENDING, MentoringLedgerTransactionType.REFUND, "PROCESSING");
        submitted.setProviderReference("payout-1");
        when(ledgerRepository.findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(5L, MentoringLedgerTransactionType.REFUND))
                .thenReturn(List.of(waiting1, waiting2, submitted));

        walletService.saveRefundAccount(EMAIL, request("ACB", "970416", "24710327", "PHAM TRUNG HIEU"));

        verify(disbursementService).dispatchPayoutAfterCommit(11L);
        verify(disbursementService).dispatchPayoutAfterCommit(12L);
        verify(disbursementService, never()).dispatchPayoutAfterCommit(13L);
    }

    @Test
    @DisplayName("UTCID15 - Unknown email -> ResourceNotFoundException and nothing saved")
    void utcid15_saveRefundAccount_userNotFound() {
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walletService.saveRefundAccount(GHOST_EMAIL, request("ACB", "970416", "24710327", "A")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng");
        verify(refundAccountRepository, never()).save(any());
    }

    // ================= RefundAccountResolver.find() / exists() =================

    private RefundAccountResolver realResolver() {
        return new RefundAccountResolver(refundAccountRepository, mentorProfileRepository, payoutAccountRepository);
    }

    @Test
    @DisplayName("UTCID16 - Declared refund account wins over the Mentor payout account")
    void utcid16_find_declaredWins() {
        UserRefundAccount declared = UserRefundAccount.builder().bankName("VCB").bankBin("970436")
                .bankAccountNumber("111111").bankAccountHolder("A").build();
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.of(declared));

        assertThat(realResolver().find(1L)).containsSame(declared);
    }

    @Test
    @DisplayName("UTCID17 - Nothing declared -> falls back to the Mentor payout account")
    void utcid17_find_fallsBackToMentorPayout() {
        MentorProfile profile = new MentorProfile();
        profile.setId(9L);
        MentorPayoutAccount payout = MentorPayoutAccount.builder().bankName("ACB").bankBin("970416")
                .bankAccountNumber("24710327").bankAccountHolder("PHAN TRUNG HIEU").build();
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(payoutAccountRepository.findByMentorProfileId(9L)).thenReturn(Optional.of(payout));

        assertThat(realResolver().find(1L)).get()
                .extracting(UserRefundAccount::getBankBin, UserRefundAccount::getBankAccountNumber)
                .containsExactly("970416", "24710327");
    }

    @Test
    @DisplayName("UTCID18 - No account anywhere -> exists() = false")
    void utcid18_exists_false() {
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThat(realResolver().exists(1L)).isFalse();
    }

    @Test
    @DisplayName("UTCID19 - Mentor payout account with 5-digit BIN -> Optional.empty")
    void utcid19_find_invalidBin() {
        MentorProfile profile = new MentorProfile();
        profile.setId(9L);
        MentorPayoutAccount payout = MentorPayoutAccount.builder().bankName("ACB").bankBin("12345")
                .bankAccountNumber("24710327").bankAccountHolder("PHAN TRUNG HIEU").build();
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(payoutAccountRepository.findByMentorProfileId(9L)).thenReturn(Optional.of(payout));

        assertThat(realResolver().find(1L)).isEmpty();
    }

    // ================= MentoringPayoutProcessor.dispatch() / resetForRetry() =================

    private void givenValidAccount() {
        MentorProfile profile = new MentorProfile();
        profile.setId(3L);
        MentorPayoutAccount account = new MentorPayoutAccount();
        account.setBankName("ACB");
        account.setBankBin("970416");
        account.setBankAccountNumber("123456789");
        account.setBankAccountHolder("NGUYEN VAN A");
        when(mentorProfileRepository.findByUserId(7L)).thenReturn(Optional.of(profile));
        when(payoutAccountRepository.findByMentorProfileId(3L)).thenReturn(Optional.of(account));
    }

    @Test
    @DisplayName("UTCID20 - Mentor has no valid payout account -> ledger stays PENDING, PayOS not called, Mentor notified")
    void utcid20_dispatch_missingBankAccount() {
        when(mentorProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.PENDING);
        assertThat(ledger.getProviderStatus()).isEqualTo("BANK_ACCOUNT_REQUIRED");
        verify(gateway, never()).processPayout(any());
        verify(notificationService).sendMentoringAccountNotification(isNull(), eq(mentor), eq("MENTOR_PAYOUT"),
                eq("100:ACCOUNT_REQUIRED"), eq("Cần tài khoản nhận thù lao"), anyString());
    }

    @Test
    @DisplayName("UTCID21 - Accepted payout -> PayOS command uses ledger amount and key, reference stored")
    void utcid21_dispatch_accepted() {
        givenValidAccount();
        when(gateway.processPayout(any())).thenReturn(DisbursementResult.builder()
                .providerReference("payout-1").providerStatus("PROCESSING").status(MentoringLedgerStatus.PENDING).build());

        processor.dispatch(100L);

        ArgumentCaptor<DisbursementCommand> command = ArgumentCaptor.forClass(DisbursementCommand.class);
        verify(gateway).processPayout(command.capture());
        assertThat(command.getValue().getIdempotencyKey()).isEqualTo("ALUMNECT-PAYOUT-TASK-42");
        assertThat(command.getValue().getAmount()).isEqualByComparingTo("500000");
        assertThat(command.getValue().getBankBin()).isEqualTo("970416");
        assertThat(ledger.getProviderReference()).isEqualTo("payout-1");
    }

    @Test
    @DisplayName("UTCID22 - PayOS rejects the payout (214) -> ledger FAILED with failureCode")
    void utcid22_dispatch_rejected() {
        givenValidAccount();
        when(gateway.processPayout(any())).thenThrow(
                new DisbursementException(DisbursementException.Kind.REJECTED, "214", "Số dư không đủ", null));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.FAILED);
        assertThat(ledger.getFailureCode()).isEqualTo("214");
        assertThat(ledger.getProviderStatus()).isEqualTo("REJECTED");
        assertThat(ledger.getNote()).contains("PayOS từ chối lệnh chi");
    }

    @Test
    @DisplayName("UTCID23 - PayOS did not accept the request (NOT_SUBMITTED) -> stays PENDING for automatic retry")
    void utcid23_dispatch_notSubmitted() {
        givenValidAccount();
        when(gateway.processPayout(any())).thenThrow(
                new DisbursementException(DisbursementException.Kind.NOT_SUBMITTED, "403", "IP không được phép", null));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.PENDING);
        assertThat(ledger.getProviderStatus()).isEqualTo("PROVIDER_UNAVAILABLE");
    }

    @Test
    @DisplayName("UTCID24 - SUBMIT_UNKNOWN is recovered by referenceId before resubmitting")
    void utcid24_dispatch_unknownRecovered() {
        ledger.setProviderStatus("SUBMIT_UNKNOWN");
        when(gateway.findPayoutByReferenceId("ALUMNECT-PAYOUT-TASK-42")).thenReturn(Optional.of(DisbursementResult.builder()
                .providerReference("payout-9").providerStatus("SUCCEEDED").status(MentoringLedgerStatus.SUCCEEDED).build()));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.SUCCEEDED);
        assertThat(ledger.getProviderReference()).isEqualTo("payout-9");
        verify(gateway, never()).processPayout(any());
    }

    @Test
    @DisplayName("UTCID25 - Already submitted payout is synchronized instead of resent")
    void utcid25_dispatch_synchronized() {
        ledger.setProviderReference("payout-1");
        when(gateway.checkDisbursementStatus("payout-1")).thenReturn(DisbursementResult.builder()
                .providerReference("payout-1").providerStatus("SUCCEEDED").status(MentoringLedgerStatus.SUCCEEDED).build());

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.SUCCEEDED);
        verify(gateway, never()).processPayout(any());
    }

    @Test
    @DisplayName("UTCID26 - Amount 1500 below the minimum 2000 -> FAILED with BELOW_MINIMUM")
    void utcid26_dispatch_belowMinimum() {
        ReflectionTestUtils.setField(processor, "minPayoutAmount", 2000L);
        ledger.setAmount(new BigDecimal("1500"));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.FAILED);
        assertThat(ledger.getProviderStatus()).isEqualTo("BELOW_MINIMUM");
        assertThat(ledger.getNote()).contains("Số tiền nhỏ hơn mức chi tối thiểu");
        verify(gateway, never()).processPayout(any());
    }

    @Test
    @DisplayName("UTCID27 - Ledger does not exist -> ResourceNotFoundException")
    void utcid27_dispatch_ledgerNotFound() {
        when(ledgerRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> processor.dispatch(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy lệnh chi với ID: 999");
    }

    @Test
    @DisplayName("UTCID28 - FAILED ledger is reopened with a rotated idempotency key (-R1, -R2)")
    void utcid28_resetForRetry_rotatesKey() {
        ledger.setStatus(MentoringLedgerStatus.FAILED);
        ledger.setProviderReference("payout-1");

        processor.resetForRetry(100L, null);

        assertThat(ledger.getIdempotencyKey()).isEqualTo("ALUMNECT-PAYOUT-TASK-42-R1");
        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.PENDING);
        assertThat(ledger.getProviderStatus()).isEqualTo("QUEUED");
        assertThat(ledger.getProviderReference()).isNull();
        assertThat(ledger.getNote()).isEqualTo("Admin yêu cầu chi lại.");

        ledger.setStatus(MentoringLedgerStatus.FAILED);
        processor.resetForRetry(100L, null);
        assertThat(ledger.getIdempotencyKey()).isEqualTo("ALUMNECT-PAYOUT-TASK-42-R2");
    }

    @Test
    @DisplayName("UTCID29 - Retry of a PENDING ledger -> ConflictException")
    void utcid29_resetForRetry_notFailed() {
        assertThatThrownBy(() -> processor.resetForRetry(100L, null))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Chỉ có thể chi lại lệnh chi đang ở trạng thái FAILED.");
    }

    @Test
    @DisplayName("UTCID30 - Retry of a ledger that is not PAYOUT/REFUND -> ConflictException")
    void utcid30_resetForRetry_notDisbursement() {
        ledger.setTransactionType(MentoringLedgerTransactionType.ESCROW_COLLECTION);
        ledger.setStatus(MentoringLedgerStatus.FAILED);

        assertThatThrownBy(() -> processor.resetForRetry(100L, null))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Chỉ có thể chi lại giao dịch loại PAYOUT hoặc REFUND.");
    }
}
