package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.notification.NotificationRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskPaymentServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-56 Mentoring - Pay for a Mentoring Task.
 * Report sheet : FE-56 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringTaskPaymentServiceImpl.createTaskPayment(),
 *                MentoringTaskPaymentServiceImpl.checkTaskPaymentStatus(),
 *                MentoringTaskPaymentServiceImpl.cancelTaskPayment(),
 *                MentoringTaskPaymentServiceImpl.handleVerifiedWebhook(),
 *                MentoringTaskPaymentServiceImpl.handlePayOSWebhook()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-56 Mentoring - Pay for a Mentoring Task")
class FE56_TaskPaymentTest {

    @Mock
    private MentoringDealRepository dealRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private MentoringTaskRepository taskRepository;

    @Mock
    private MentoringTaskPaymentRepository paymentRepository;

    @Mock
    private MentoringRequestRepository requestRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MentoringConversationService conversationService;

    @Mock
    private MentoringPaymentLedgerRepository ledgerRepository;

    @Mock
    private MentoringRequestDistributionRepository distributionRepository;

    @Mock
    private PayOSGateway payOSGateway;

    @Mock
    private MentoringTaskMapper taskMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MentoringGroupService mentoringGroupService;

    @Mock
    private MentoringTaskAmendmentRepository amendmentRepository;

    @Mock
    private MentoringRules mentoringRules;

    @InjectMocks
    private MentoringTaskPaymentServiceImpl taskPaymentService;

    private static final Long STUDENT_USER_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long DEAL_ID = 100L;
    private static final Long REQUEST_ID = 200L;
    private static final Long ORDER_CODE = 987654321L;

    private User studentUser;
    private User mentorUser;
    private MentoringRequest mentoringRequest;
    private MentoringDeal deal;
    private MentoringTaskPayment payment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(taskPaymentService, "taskReturnUrl", "http://localhost:5173/return");
        ReflectionTestUtils.setField(taskPaymentService, "taskCancelUrl", "http://localhost:5173/cancel");
        ReflectionTestUtils.setField(taskPaymentService, "expirationMinutes", 15);

        studentUser = User.builder().id(STUDENT_USER_ID).email("student@fpt.edu.vn").build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email("mentor@fpt.edu.vn").build();

        mentoringRequest = MentoringRequest.builder()
                .id(REQUEST_ID)
                .student(studentUser)
                .status(MentoringRequestStatus.OPEN)
                .title("Hướng dẫn đồ án")
                .build();

        deal = MentoringDeal.builder()
                .id(DEAL_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .request(mentoringRequest)
                .conversation(Conversation.builder().id(50L).build())
                .status(MentoringDealStatus.DEAL_CONFIRMED)
                .isLocked(true)
                .mentorConfirmed(true)
                .studentConfirmed(true)
                .isPaid(false)
                .taskScope("Xây dựng kiến trúc Microservice cho hệ thống")
                .agreedPrice(BigDecimal.valueOf(500000))
                .deadline(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();

        payment = MentoringTaskPayment.builder()
                .id(10L)
                .deal(deal)
                .request(mentoringRequest)
                .student(studentUser)
                .orderCode(ORDER_CODE)
                .amount(BigDecimal.valueOf(500000))
                .paymentStatus(PaymentStatus.PENDING)
                .paymentExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
    }

    // ================= createTaskPayment() =================

    @Test
    @DisplayName("UTCID01 - Deal DEAL_CONFIRMED; caller is the student -> createTaskPayment -> PayOS link and QR returned; transaction PENDING")
    void utcid01_createTaskPayment_ok() {
        // Given
        CreateTaskPaymentRequest requestDto = new CreateTaskPaymentRequest();
        requestDto.setDealId(DEAL_ID);

        when(dealRepository.findById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(taskRepository.findByRequestId(REQUEST_ID)).thenReturn(Optional.empty());
        when(taskRepository.existsByDealId(DEAL_ID)).thenReturn(false);
        when(paymentRepository.findFirstByRequestIdAndPaymentStatusOrderByCreatedAtDesc(REQUEST_ID, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());

        CreatePaymentLinkResponse payOsResp = org.mockito.Mockito.mock(CreatePaymentLinkResponse.class);
        when(payOsResp.getCheckoutUrl()).thenReturn("https://payos.vn/checkout");
        when(payOsResp.getQrCode()).thenReturn("data:image/png;base64,qr");
        when(payOsResp.getPaymentLinkId()).thenReturn("link123");
        when(payOSGateway.createPaymentLink(any(CreatePaymentLinkRequest.class))).thenReturn(payOsResp);
        when(paymentRepository.save(any(MentoringTaskPayment.class))).thenReturn(payment);
        when(taskMapper.toCheckoutResponse(any(MentoringTaskPayment.class))).thenReturn(new MentoringTaskPaymentCheckoutResponse());

        // When
        MentoringTaskPaymentCheckoutResponse response = taskPaymentService.createTaskPayment(STUDENT_USER_ID, requestDto);

        // Then
        assertThat(response).isNotNull();
        verify(paymentRepository).save(any(MentoringTaskPayment.class));
    }

    @Test
    @DisplayName("UTCID02 - A PENDING transaction exists -> createTaskPayment -> Same transaction returned")
    void utcid02_createTaskPayment_okReusedPending() {
        // Given
        CreateTaskPaymentRequest requestDto = new CreateTaskPaymentRequest();
        requestDto.setDealId(DEAL_ID);

        when(dealRepository.findById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(taskRepository.findByRequestId(REQUEST_ID)).thenReturn(Optional.empty());
        when(taskRepository.existsByDealId(DEAL_ID)).thenReturn(false);
        when(paymentRepository.findFirstByRequestIdAndPaymentStatusOrderByCreatedAtDesc(REQUEST_ID, PaymentStatus.PENDING))
                .thenReturn(Optional.of(payment));
        when(taskMapper.toCheckoutResponse(payment)).thenReturn(new MentoringTaskPaymentCheckoutResponse());

        // When
        MentoringTaskPaymentCheckoutResponse response = taskPaymentService.createTaskPayment(STUDENT_USER_ID, requestDto);

        // Then
        assertThat(response).isNotNull();
        verify(payOSGateway, never()).createPaymentLink(any());
    }

    @Test
    @DisplayName("UTCID03 - Caller is the mentor -> createTaskPayment -> ForbiddenException")
    void utcid03_createTaskPayment_forbiddenMentor() {
        // Given
        CreateTaskPaymentRequest requestDto = new CreateTaskPaymentRequest();
        requestDto.setDealId(DEAL_ID);
        when(dealRepository.findById(DEAL_ID)).thenReturn(Optional.of(deal));

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.createTaskPayment(MENTOR_USER_ID, requestDto))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ có Học viên (Student) tham gia Deal mới có quyền thực hiện thanh toán nhiệm vụ này.");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID04 - Deal not confirmed -> createTaskPayment -> ConflictException")
    void utcid04_createTaskPayment_conflictDealNotConfirmed() {
        // Given
        deal.setStatus(MentoringDealStatus.MENTOR_CONFIRMED); // Not DEAL_CONFIRMED
        CreateTaskPaymentRequest requestDto = new CreateTaskPaymentRequest();
        requestDto.setDealId(DEAL_ID);

        when(dealRepository.findById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.createTaskPayment(STUDENT_USER_ID, requestDto))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Thỏa thuận Deal chưa được cả hai bên xác nhận hoàn tất (DEAL_CONFIRMED). Không thể thanh toán.");
    }

    @Test
    @DisplayName("UTCID05 - Task already activated -> createTaskPayment -> ConflictException")
    void utcid05_createTaskPayment_conflictTaskAlreadyActivated() {
        // Given
        deal.setIsPaid(true); // already paid
        CreateTaskPaymentRequest requestDto = new CreateTaskPaymentRequest();
        requestDto.setDealId(DEAL_ID);

        when(dealRepository.findById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.createTaskPayment(STUDENT_USER_ID, requestDto))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Thỏa thuận Deal này đã được thanh toán và kích hoạt Task trước đó rồi.");
    }

    @Test
    @DisplayName("UTCID06 - Deal deadline passed -> createTaskPayment -> ConflictException")
    void utcid06_createTaskPayment_conflictDeadlinePassed() {
        // Given
        deal.setDeadline(Instant.now().minus(1, ChronoUnit.DAYS)); // in past
        CreateTaskPaymentRequest requestDto = new CreateTaskPaymentRequest();
        requestDto.setDealId(DEAL_ID);

        when(dealRepository.findById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(taskRepository.findByRequestId(REQUEST_ID)).thenReturn(Optional.empty());
        when(taskRepository.existsByDealId(DEAL_ID)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.createTaskPayment(STUDENT_USER_ID, requestDto))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Deadline của thỏa thuận đã qua. Vui lòng đề nghị Mentor gửi phiên bản Deal mới với deadline hợp lệ.");
    }

    // ================= checkTaskPaymentStatus() =================

    @Test
    @DisplayName("UTCID07 - PayOS reports PAID -> checkTaskPaymentStatus -> Transaction PAID; Task created in PREPARATION; escrow ledger saved")
    void utcid07_checkTaskPaymentStatus_okPaid() {
        // Given
        when(paymentRepository.findForUpdateByOrderCode(ORDER_CODE)).thenReturn(Optional.of(payment));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        PaymentLink payosLink = org.mockito.Mockito.mock(PaymentLink.class);
        when(payosLink.getStatus()).thenReturn(vn.payos.model.v2.paymentRequests.PaymentLinkStatus.PAID);
        when(payOSGateway.getPaymentLinkInformation(ORDER_CODE)).thenReturn(payosLink);
        when(taskRepository.save(any(MentoringTask.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(taskMapper.toStatusResponse(payment)).thenReturn(new MentoringTaskPaymentStatusResponse());

        // When
        MentoringTaskPaymentStatusResponse response = taskPaymentService.checkTaskPaymentStatus(STUDENT_USER_ID, ORDER_CODE);

        // Then
        assertThat(response).isNotNull();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(deal.getIsPaid()).isTrue();
        assertThat(mentoringRequest.getStatus()).isEqualTo(MentoringRequestStatus.CLOSED);
        verify(ledgerRepository).save(any());
        verify(taskRepository).save(any());
    }

    @Test
    @DisplayName("UTCID08 - Caller is not the payer -> checkTaskPaymentStatus -> ForbiddenException")
    void utcid08_checkTaskPaymentStatus_forbiddenNotPayer() {
        // Given
        when(paymentRepository.findForUpdateByOrderCode(ORDER_CODE)).thenReturn(Optional.of(payment));

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.checkTaskPaymentStatus(999L, ORDER_CODE))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền xem thông tin giao dịch thanh toán này.");
    }

    // ================= cancelTaskPayment() =================

    @Test
    @DisplayName("UTCID09 - Transaction PENDING -> cancelTaskPayment -> Transaction CANCELLED")
    void utcid09_cancelTaskPayment_ok() {
        // Given
        when(paymentRepository.findForUpdateByOrderCode(ORDER_CODE)).thenReturn(Optional.of(payment));
        when(taskMapper.toStatusResponse(payment)).thenReturn(new MentoringTaskPaymentStatusResponse());

        // When
        MentoringTaskPaymentStatusResponse response = taskPaymentService.cancelTaskPayment(STUDENT_USER_ID, ORDER_CODE);

        // Then
        assertThat(response).isNotNull();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        verify(payOSGateway).cancelPaymentLink(eq(ORDER_CODE), any());
    }

    @Test
    @DisplayName("UTCID10 - Transaction PAID -> cancelTaskPayment -> ConflictException")
    void utcid10_cancelTaskPayment_conflictAlreadyPaid() {
        // Given
        payment.setPaymentStatus(PaymentStatus.PAID);
        when(paymentRepository.findForUpdateByOrderCode(ORDER_CODE)).thenReturn(Optional.of(payment));

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.cancelTaskPayment(STUDENT_USER_ID, ORDER_CODE))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Không thể hủy giao dịch đã thanh toán thành công.");
    }

    // ================= handleVerifiedWebhook() =================

    @Test
    @DisplayName("UTCID11 - Valid PAID webhook -> handleVerifiedWebhook -> Task activated and other deals of the request closed")
    void utcid11_handleVerifiedWebhook_ok() {
        // Given
        WebhookData data = org.mockito.Mockito.mock(WebhookData.class);
        when(data.getOrderCode()).thenReturn(ORDER_CODE);
        when(data.getCode()).thenReturn("00");
        when(data.getAmount()).thenReturn(500000L);

        when(paymentRepository.findForUpdateByOrderCode(ORDER_CODE)).thenReturn(Optional.of(payment));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(taskRepository.save(any(MentoringTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        taskPaymentService.handleVerifiedWebhook(data);

        // Then
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(deal.getIsPaid()).isTrue();
        assertThat(mentoringRequest.getStatus()).isEqualTo(MentoringRequestStatus.CLOSED);
        verify(taskRepository).save(any());
        verify(ledgerRepository).save(any());
    }

    @Test
    @DisplayName("UTCID12 - Same webhook received twice -> handleVerifiedWebhook -> Second call ignored; one task and one ledger entry")
    void utcid12_handleVerifiedWebhook_okIdempotent() {
        // Given: payment already PAID
        payment.setPaymentStatus(PaymentStatus.PAID);
        WebhookData data = org.mockito.Mockito.mock(WebhookData.class);
        when(data.getOrderCode()).thenReturn(ORDER_CODE);

        when(paymentRepository.findForUpdateByOrderCode(ORDER_CODE)).thenReturn(Optional.of(payment));

        // When
        taskPaymentService.handleVerifiedWebhook(data);

        // Then
        verify(taskRepository, never()).save(any());
        verify(ledgerRepository, never()).save(any());
    }

    // ================= handlePayOSWebhook() =================

    @Test
    @DisplayName("UTCID13 - Webhook with wrong signature -> handlePayOSWebhook -> BadRequestException")
    void utcid13_handlePayOSWebhook_badRequestWrongSignature() {
        // Given
        Webhook webhook = org.mockito.Mockito.mock(Webhook.class);
        when(payOSGateway.verifyPaymentWebhookData(webhook)).thenThrow(new RuntimeException("Invalid signature"));

        // When + Then
        assertThatThrownBy(() -> taskPaymentService.handlePayOSWebhook(webhook))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chữ ký Webhook PayOS không hợp lệ.");
        verify(paymentRepository, never()).findForUpdateByOrderCode(any());
    }
}
