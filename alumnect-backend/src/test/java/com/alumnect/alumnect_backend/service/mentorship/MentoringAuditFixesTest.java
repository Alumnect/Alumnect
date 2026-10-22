package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorReviewRequest;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementCommand;
import com.alumnect.alumnect_backend.integration.disbursement.DisbursementResult;
import com.alumnect.alumnect_backend.integration.disbursement.MentoringDisbursementGateway;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Các quy tắc được bổ sung sau đợt rà soát module Mentoring. */
@ExtendWith(MockitoExtension.class)
class MentoringAuditFixesTest {

    @Mock MentoringPaymentLedgerRepository ledgerRepository;
    @Mock MentorProfileRepository mentorProfileRepository;
    @Mock MentorPayoutAccountRepository payoutAccountRepository;
    @Mock RefundAccountResolver refundAccountResolver;
    @Mock MentoringDisbursementGateway gateway;
    @Mock NotificationService notificationService;
    @Mock MentoringTaskRepository taskRepository;

    User student = user(1L, "student@alumnect.vn");
    User mentor = user(2L, "mentor@alumnect.vn");

    // ---------- Hoàn tiền / mức chi tối thiểu ----------

    @Test void refundIsPaidToStudentRefundAccountWithRefundCategory() {
        MentoringPayoutProcessor processor = processor(2000);
        MentoringPaymentLedger refund = ledger(MentoringLedgerTransactionType.REFUND, "50000");
        when(ledgerRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(refund));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(refundAccountResolver.find(1L)).thenReturn(Optional.of(UserRefundAccount.builder()
                .user(student).bankName("ACB").bankBin("970416").bankAccountNumber("123456789").bankAccountHolder("SV A").build()));
        when(gateway.processPayout(any())).thenReturn(DisbursementResult.builder()
                .providerReference("payout-1").status(MentoringLedgerStatus.PENDING).providerStatus("PROCESSING").build());

        processor.dispatch(100L);

        ArgumentCaptor<DisbursementCommand> command = ArgumentCaptor.forClass(DisbursementCommand.class);
        verify(gateway).processPayout(command.capture());
        assertThat(command.getValue().getBeneficiaryUserId()).isEqualTo(1L);
        assertThat(command.getValue().getCategory()).isEqualTo("refund");
        assertThat(refund.getProviderReference()).isEqualTo("payout-1");
    }

    @Test void payoutBelowMinimumIsNotSentToPayOS() {
        MentoringPayoutProcessor processor = processor(2000);
        MentoringPaymentLedger payout = ledger(MentoringLedgerTransactionType.PAYOUT, "1000");
        when(ledgerRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(payout));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        processor.dispatch(100L);

        assertThat(payout.getStatus()).isEqualTo(MentoringLedgerStatus.FAILED);
        assertThat(payout.getProviderStatus()).isEqualTo(MentoringPayoutProcessor.BELOW_MINIMUM);
        verify(gateway, never()).processPayout(any());
    }

    // ---------- Quy tắc số tiền ----------

    @Test void moneyMustBeWholeVndAndAboveMinimum() {
        MentoringRules rules = new MentoringRules(taskRepository, ledgerRepository);
        ReflectionTestUtils.setField(rules, "minAmount", 2000L);

        assertThatThrownBy(() -> rules.requirePayableAmount(new BigDecimal("2500.5"), "Giá")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> rules.requirePayableAmount(BigDecimal.ZERO, "Giá")).isInstanceOf(BadRequestException.class);
        rules.requirePayableAmount(new BigDecimal("2000.00"), "Giá");
    }

    @Test void mentorAtCapacityCannotTakeMoreTasks() {
        MentoringRules rules = new MentoringRules(taskRepository, ledgerRepository);
        ReflectionTestUtils.setField(rules, "maxActiveTasksPerMentor", 2);
        when(taskRepository.countByMentorIdAndStatusIn(any(), any())).thenReturn(2L);

        assertThatThrownBy(() -> rules.requireMentorCapacity(2L)).isInstanceOf(ConflictException.class);
    }

    // ---------- Đánh giá Mentor ----------

    @Test void reviewRequiresCompletedTaskOfReviewerAndOnlyOncePerTask() {
        MentorReviewRepository reviewRepository = mock(MentorReviewRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        MentorReputationServiceImpl service = new MentorReputationServiceImpl(
                mentorProfileRepository, reviewRepository, taskRepository, userRepository, mock(UserProfileRepository.class));
        MentoringTask task = MentoringTask.builder().id(10L).student(student).mentor(mentor).status(MentoringTaskStatus.IN_PROGRESS).build();
        when(userRepository.findByEmail("student@alumnect.vn")).thenReturn(Optional.of(student));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        MentorReviewRequest request = MentorReviewRequest.builder().taskId(10L).rating(5).build();

        assertThatThrownBy(() -> service.submitMentorReview("student@alumnect.vn", request)).isInstanceOf(BadRequestException.class);

        task.setStatus(MentoringTaskStatus.COMPLETED);
        when(reviewRepository.existsByTaskId(10L)).thenReturn(true);
        assertThatThrownBy(() -> service.submitMentorReview("student@alumnect.vn", request)).isInstanceOf(ConflictException.class);
    }

    // ---------- Hủy Request ----------

    @Test void onlyOwnerCanCancelOpenRequestAndPendingResponsesExpire() {
        MentoringRequestRepository requestRepository = mock(MentoringRequestRepository.class);
        MentoringRequestDistributionRepository distributionRepository = mock(MentoringRequestDistributionRepository.class);
        MentoringDealRepository dealRepository = mock(MentoringDealRepository.class);
        MentoringTaskPaymentRepository paymentRepository = mock(MentoringTaskPaymentRepository.class);
        ConversationRepository conversationRepository = mock(ConversationRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        MentoringRequestLifecycleService lifecycle = new MentoringRequestLifecycleService(requestRepository, distributionRepository,
                dealRepository, taskRepository, paymentRepository, conversationRepository, userRepository,
                mock(MentoringConversationService.class), notificationService,
                mock(com.alumnect.alumnect_backend.dao.notification.NotificationRepository.class), mock(PayOSGateway.class));

        MentoringRequest request = MentoringRequest.builder().id(8L).title("Java").student(student).status(MentoringRequestStatus.OPEN).build();
        when(requestRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("mentor@alumnect.vn")).thenReturn(Optional.of(mentor));
        assertThatThrownBy(() -> lifecycle.cancelByOwner("mentor@alumnect.vn", 8L, null)).isInstanceOf(ForbiddenException.class);

        MentoringRequestDistribution pending = MentoringRequestDistribution.builder().status(MentoringDistributionStatus.PENDING).build();
        when(userRepository.findByEmail("student@alumnect.vn")).thenReturn(Optional.of(student));
        when(taskRepository.findByRequestId(8L)).thenReturn(Optional.empty());
        when(distributionRepository.findByRequestIdAndStatus(8L, MentoringDistributionStatus.PENDING)).thenReturn(List.of(pending));

        lifecycle.cancelByOwner("student@alumnect.vn", 8L, "Không còn nhu cầu");

        assertThat(request.getStatus()).isEqualTo(MentoringRequestStatus.CANCELLED);
        assertThat(pending.getStatus()).isEqualTo(MentoringDistributionStatus.EXPIRED);
    }

    // ---------- helpers ----------

    private MentoringPayoutProcessor processor(long minAmount) {
        MentoringPayoutProcessor processor = new MentoringPayoutProcessor(ledgerRepository, mentorProfileRepository,
                payoutAccountRepository, refundAccountResolver, gateway, notificationService);
        ReflectionTestUtils.setField(processor, "minPayoutAmount", minAmount);
        return processor;
    }

    private MentoringPaymentLedger ledger(MentoringLedgerTransactionType type, String amount) {
        return MentoringPaymentLedger.builder().id(100L).student(student).mentor(mentor)
                .task(MentoringTask.builder().id(10L).build())
                .amount(new BigDecimal(amount)).transactionType(type).status(MentoringLedgerStatus.PENDING)
                .providerStatus(MentoringPayoutProcessor.QUEUED).idempotencyKey("KEY-1").build();
    }

    private static User user(Long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        return u;
    }
}
