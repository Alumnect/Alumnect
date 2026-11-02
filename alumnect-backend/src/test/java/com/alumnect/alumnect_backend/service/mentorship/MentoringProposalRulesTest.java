package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskAmendmentRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondDeadlineExtensionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondSettlementProposalRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskAmendment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskDeadlineExtension;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Quy tắc đề xuất trong Task: bắt buộc tài khoản hoàn tiền, hủy / từ chối đề xuất, khóa khi Task dừng. */
@ExtendWith(MockitoExtension.class)
class MentoringProposalRulesTest {
    static final long STUDENT_ID = 1L, MENTOR_ID = 2L;

    @Mock MentoringTaskRepository taskRepository;
    @Mock MentoringTaskDeadlineExtensionRepository extensionRepository;
    @Mock MentoringTaskAmendmentRepository amendmentRepository;
    @Mock MentoringTaskSettlementProposalRepository settlementProposalRepository;
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock MentoringConversationService conversationService;
    @Mock NotificationService notificationService;
    @Mock MentoringTaskPaymentService taskPaymentService;
    @Mock MentoringRules mentoringRules;
    @Mock MentoringPaymentLedgerRepository ledgerRepository;
    @Mock MentoringTicketService ticketService;
    @Mock RefundAccountResolver refundAccountResolver;
    @InjectMocks MentoringTaskResolutionServiceImpl service;

    User student = user(STUDENT_ID);
    User mentor = user(MENTOR_ID);
    MentoringTask task;

    @BeforeEach void setup() {
        task = MentoringTask.builder().id(10L).student(student).mentor(mentor).status(MentoringTaskStatus.IN_PROGRESS)
                .taskScope("Phạm vi").expectedResult("Kết quả").agreedPrice(new BigDecimal("4000"))
                .deadline(Instant.now().plusSeconds(86400)).build();
        lenient().when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        lenient().when(userRepository.findById(MENTOR_ID)).thenReturn(Optional.of(mentor));
    }

    @Test void studentCannotAcceptRefundSettlementWithoutRefundAccount() {
        MentoringTaskSettlementProposal proposal = MentoringTaskSettlementProposal.builder().id(5L).task(task)
                .createdBy(mentor).recipient(student).mentorAmount(new BigDecimal("1000")).studentRefund(new BigDecimal("3000"))
                .totalAmount(new BigDecimal("4000")).status(MentoringSettlementProposalStatus.PENDING).build();
        when(settlementProposalRepository.findById(5L)).thenReturn(Optional.of(proposal));
        when(refundAccountResolver.exists(STUDENT_ID)).thenReturn(false);

        RespondSettlementProposalRequest accept = new RespondSettlementProposalRequest();
        accept.setAccept(true);
        assertThatThrownBy(() -> service.respondSettlementProposal(STUDENT_ID, 5L, accept))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("tài khoản nhận hoàn tiền");
        assertThat(proposal.getStatus()).isEqualTo(MentoringSettlementProposalStatus.PENDING);
    }

    @Test void mentorCancelsAmendmentAwaitingTopUpAndPendingPaymentLinksAreCancelled() {
        MentoringTaskAmendment amendment = amendment(MentoringAmendmentStatus.AWAITING_TOPUP);
        when(amendmentRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(amendment));
        when(amendmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.cancelTaskAmendment(MENTOR_ID, 30L, null);

        assertThat(amendment.getStatus()).isEqualTo(MentoringAmendmentStatus.CANCELLED);
        verify(taskPaymentService).cancelPendingTopUpPayments(eq(30L), any());
    }

    @Test void studentDeclinesTopUpAndAmendmentIsRejected() {
        MentoringTaskAmendment amendment = amendment(MentoringAmendmentStatus.AWAITING_TOPUP);
        when(amendmentRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(amendment));
        when(amendmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.cancelTaskAmendment(STUDENT_ID, 30L, "Ngân sách không đủ");

        assertThat(amendment.getStatus()).isEqualTo(MentoringAmendmentStatus.REJECTED);
        verify(taskPaymentService).cancelPendingTopUpPayments(eq(30L), any());
    }

    @Test void studentCannotWithdrawPendingAmendmentCreatedByMentor() {
        MentoringTaskAmendment amendment = amendment(MentoringAmendmentStatus.PENDING);
        when(amendmentRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(amendment));

        assertThatThrownBy(() -> service.cancelTaskAmendment(STUDENT_ID, 30L, null)).isInstanceOf(ConflictException.class);
    }

    @Test void amendmentWithoutAnyChangeIsRejected() {
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        CreateTaskAmendmentRequest request = CreateTaskAmendmentRequest.builder()
                .newScope("Phạm vi").additionalAmount(BigDecimal.ZERO).reason("Không đổi gì").build();

        assertThatThrownBy(() -> service.createTaskAmendment(MENTOR_ID, 10L, request))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("chưa có thay đổi");
    }

    @Test void proposalsCannotBeAnsweredOnceTaskIsDisputed() {
        task.setStatus(MentoringTaskStatus.DISPUTED);
        MentoringTaskDeadlineExtension extension = MentoringTaskDeadlineExtension.builder().id(7L).task(task)
                .createdBy(mentor).recipient(student).currentDeadline(task.getDeadline())
                .proposedDeadline(task.getDeadline().plusSeconds(86400)).status(MentoringExtensionStatus.PENDING).build();
        when(extensionRepository.findById(7L)).thenReturn(Optional.of(extension));

        RespondDeadlineExtensionRequest accept = new RespondDeadlineExtensionRequest();
        accept.setAccept(true);
        assertThatThrownBy(() -> service.respondDeadlineExtension(STUDENT_ID, 7L, accept)).isInstanceOf(ConflictException.class);
    }

    private MentoringTaskAmendment amendment(MentoringAmendmentStatus status) {
        return MentoringTaskAmendment.builder().id(30L).task(task).version(1).createdBy(mentor).recipient(student)
                .additionalAmount(new BigDecimal("2000")).previousDeadline(task.getDeadline()).newDeadline(task.getDeadline())
                .status(status).build();
    }

    private static User user(Long id) {
        User u = new User();
        u.setId(id);
        return u;
    }
}
