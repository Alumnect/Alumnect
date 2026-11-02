package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskAmendment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Thanh toán bổ sung (top-up) của Ticket điều chỉnh: chỉ cộng tiền vào Task sau khi PayOS xác nhận đã thanh toán. */
@ExtendWith(MockitoExtension.class)
class MentoringTopUpPaymentTest {
    static final long STUDENT_ID = 1L, MENTOR_ID = 2L;

    @Mock MentoringDealRepository dealRepository;
    @Mock MentoringTaskRepository taskRepository;
    @Mock MentoringTaskPaymentRepository paymentRepository;
    @Mock MentoringTaskAmendmentRepository amendmentRepository;
    @Mock MentoringPaymentLedgerRepository ledgerRepository;
    @Mock MentoringConversationService conversationService;
    @Mock com.alumnect.alumnect_backend.service.notification.NotificationService notificationService;
    @Mock PayOSGateway payOSGateway;
    @Mock MentoringTaskMapper taskMapper;
    @InjectMocks MentoringTaskPaymentServiceImpl service;

    MentoringDeal deal;
    MentoringTask task;
    MentoringTaskAmendment amendment;

    @BeforeEach void setup() {
        User student = user(STUDENT_ID);
        User mentor = user(MENTOR_ID);
        deal = MentoringDeal.builder().id(5L).student(student).mentor(mentor).request(MentoringRequest.builder().id(8L).build()).build();
        task = MentoringTask.builder().id(10L).deal(deal).request(deal.getRequest()).student(student).mentor(mentor)
                .agreedPrice(new BigDecimal("2000")).status(MentoringTaskStatus.IN_PROGRESS)
                .deadline(Instant.now().plusSeconds(86400)).build();
        amendment = MentoringTaskAmendment.builder().id(30L).task(task).version(2)
                .additionalAmount(new BigDecimal("1000")).newScope("Phạm vi mới")
                .status(MentoringAmendmentStatus.AWAITING_TOPUP).build();
    }

    @Test void paidTopUpAddsMoneyToTaskAppliesAmendmentAndRecordsEscrowLedger() {
        MentoringTaskPayment payment = MentoringTaskPayment.builder().id(40L).deal(deal).task(task).amendment(amendment)
                .student(task.getStudent()).orderCode(999L).amount(new BigDecimal("1000"))
                .paymentStatus(PaymentStatus.PENDING).paymentExpiresAt(Instant.now().plusSeconds(600)).build();
        when(paymentRepository.findForUpdateByOrderCode(999L)).thenReturn(Optional.of(payment));
        when(amendmentRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(amendment));
        PaymentLink link = mock(PaymentLink.class);
        when(link.getStatus()).thenReturn(PaymentLinkStatus.PAID);
        when(payOSGateway.getPaymentLinkInformation(999L)).thenReturn(link);
        when(taskMapper.toStatusResponse(any())).thenReturn(new MentoringTaskPaymentStatusResponse());

        service.checkTaskPaymentStatus(STUDENT_ID, 999L);

        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(task.getAgreedPrice()).isEqualByComparingTo("3000");
        assertThat(task.getTaskScope()).isEqualTo("Phạm vi mới");
        assertThat(amendment.getStatus()).isEqualTo(MentoringAmendmentStatus.APPLIED);
        ArgumentCaptor<MentoringPaymentLedger> ledger = ArgumentCaptor.forClass(MentoringPaymentLedger.class);
        verify(ledgerRepository).save(ledger.capture());
        assertThat(ledger.getValue().getAmount()).isEqualByComparingTo("1000");
        assertThat(ledger.getValue().getTransactionType()).isEqualTo(MentoringLedgerTransactionType.ESCROW_COLLECTION);
    }

    @Test void topUpCheckoutRejectsMentorAndAmendmentNotAwaitingPayment() {
        when(amendmentRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(amendment));
        CreateTaskPaymentRequest request = CreateTaskPaymentRequest.builder().dealId(5L).amendmentId(30L).build();
        when(dealRepository.findById(5L)).thenReturn(Optional.of(deal));

        // Mentor (không phải Học viên) không được thanh toán thay
        assertThatThrownBy(() -> service.createTaskPayment(MENTOR_ID, request)).isInstanceOf(ForbiddenException.class);

        // Ticket chưa được chấp nhận / đã bị thay thế thì không có gì để thanh toán
        amendment.setStatus(MentoringAmendmentStatus.SUPERSEDED);
        assertThatThrownBy(() -> service.createTaskPayment(STUDENT_ID, request)).isInstanceOf(ConflictException.class);
    }

    private static User user(Long id) {
        User u = new User();
        u.setId(id);
        return u;
    }
}
