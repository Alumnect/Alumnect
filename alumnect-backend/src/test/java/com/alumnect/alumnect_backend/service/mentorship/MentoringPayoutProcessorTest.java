package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementCommand;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementResult;
import com.alumnect.alumnect_backend.integration.disbursement.MentoringDisbursementGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MentoringPayoutProcessorTest {
    @Mock MentoringPaymentLedgerRepository ledgerRepository;
    @Mock MentorProfileRepository mentorProfileRepository;
    @Mock MentorPayoutAccountRepository payoutAccountRepository;
    @Mock MentoringDisbursementGateway gateway;
    @Mock com.alumnect.alumnect_backend.dao.mentorship.UserRefundAccountRepository refundAccountRepository;
    @Mock com.alumnect.alumnect_backend.service.notification.NotificationService notificationService;
    MentoringPayoutProcessor processor;
    MentoringPaymentLedger ledger;

    @BeforeEach void setup() {
        processor = new MentoringPayoutProcessor(ledgerRepository, mentorProfileRepository, payoutAccountRepository, refundAccountRepository, gateway, notificationService);
        User mentor = new User();
        mentor.setId(7L);
        MentoringTask task = new MentoringTask();
        task.setId(42L);
        ledger = MentoringPaymentLedger.builder()
                .id(100L).task(task).mentor(mentor).amount(new BigDecimal("500000.00"))
                .transactionType(MentoringLedgerTransactionType.PAYOUT)
                .status(MentoringLedgerStatus.PENDING)
                .providerStatus(MentoringPayoutProcessor.QUEUED)
                .idempotencyKey("ALUMNECT-PAYOUT-TASK-42")
                .build();
        lenient().when(ledgerRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(ledger));
        lenient().when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test void missingBankAccountKeepsLedgerPendingWithoutCallingPayOS() {
        when(mentorProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.PENDING);
        assertThat(ledger.getProviderStatus()).isEqualTo(MentoringPayoutProcessor.BANK_ACCOUNT_REQUIRED);
        verify(gateway, never()).processPayout(any());
    }

    @Test void acceptedPayoutStoresPayOSReferenceAndUsesLedgerAmountAndKey() {
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

    @Test void rejectedPayoutIsMarkedFailed() {
        givenValidAccount();
        when(gateway.processPayout(any())).thenThrow(
                new DisbursementException(DisbursementException.Kind.REJECTED, "214", "Số dư không đủ", null));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.FAILED);
        assertThat(ledger.getFailureCode()).isEqualTo("214");
    }

    @Test void notSubmittedPayoutStaysPendingForAutomaticRetry() {
        givenValidAccount();
        when(gateway.processPayout(any())).thenThrow(
                new DisbursementException(DisbursementException.Kind.NOT_SUBMITTED, "403", "IP không được phép", null));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.PENDING);
        assertThat(ledger.getProviderStatus()).isEqualTo(MentoringPayoutProcessor.PROVIDER_UNAVAILABLE);
    }

    @Test void unknownSubmitResultIsRecoveredByReferenceIdBeforeResubmitting() {
        ledger.setProviderStatus(MentoringPayoutProcessor.SUBMIT_UNKNOWN);
        when(gateway.findPayoutByReferenceId("ALUMNECT-PAYOUT-TASK-42")).thenReturn(Optional.of(DisbursementResult.builder()
                .providerReference("payout-9").providerStatus("SUCCEEDED").status(MentoringLedgerStatus.SUCCEEDED).build()));

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.SUCCEEDED);
        assertThat(ledger.getProviderReference()).isEqualTo("payout-9");
        verify(gateway, never()).processPayout(any());
    }

    @Test void submittedPayoutIsSynchronizedInsteadOfResent() {
        ledger.setProviderReference("payout-1");
        when(gateway.checkDisbursementStatus("payout-1")).thenReturn(DisbursementResult.builder()
                .providerReference("payout-1").providerStatus("SUCCEEDED").status(MentoringLedgerStatus.SUCCEEDED).build());

        processor.dispatch(100L);

        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.SUCCEEDED);
        verify(gateway, never()).processPayout(any());
    }

    @Test void retryRequiresFailedLedgerAndRotatesIdempotencyKey() {
        assertThatThrownBy(() -> processor.resetForRetry(100L, null)).isInstanceOf(ConflictException.class);

        ledger.setStatus(MentoringLedgerStatus.FAILED);
        ledger.setProviderReference("payout-1");
        processor.resetForRetry(100L, null);
        assertThat(ledger.getIdempotencyKey()).isEqualTo("ALUMNECT-PAYOUT-TASK-42-R1");
        assertThat(ledger.getStatus()).isEqualTo(MentoringLedgerStatus.PENDING);
        assertThat(ledger.getProviderReference()).isNull();

        ledger.setStatus(MentoringLedgerStatus.FAILED);
        processor.resetForRetry(100L, null);
        assertThat(ledger.getIdempotencyKey()).isEqualTo("ALUMNECT-PAYOUT-TASK-42-R2");
    }

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
}
