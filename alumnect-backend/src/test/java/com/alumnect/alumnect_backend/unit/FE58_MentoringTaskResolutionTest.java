package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringCompletionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskCompletionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateDeadlineExtensionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateSettlementProposalRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskAmendmentRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondDeadlineExtensionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondSettlementProposalRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondTaskAmendmentRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskAmendmentResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskCompletionResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskDeadlineExtensionResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskSettlementProposalResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskAmendment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskCompletion;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskDeadlineExtension;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.service.mentorship.MentorReputationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDisbursementService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskCompletionServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskPaymentService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskProposalCleaner;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskResolutionServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTicketService;
import com.alumnect.alumnect_backend.service.mentorship.RefundAccountResolver;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit Test Suite cho FE-58: Mentoring - Task Extension, Amendment & Completion
 * Tổng cộng 23 Test Cases (UTCID01 -> UTCID23).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-58 Mentoring - Task Extension, Amendment & Completion")
class FE58_MentoringTaskResolutionTest {

    @Mock
    private MentoringTaskRepository taskRepository;

    @Mock
    private MentoringTaskDeadlineExtensionRepository extensionRepository;

    @Mock
    private MentoringTaskAmendmentRepository amendmentRepository;

    @Mock
    private MentoringTaskSettlementProposalRepository settlementProposalRepository;

    @Mock
    private MentoringTaskCompletionRepository completionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private MentoringConversationService mentoringConversationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MentoringTaskPaymentService taskPaymentService;

    @Mock
    private MentoringRules mentoringRules;

    @Mock
    private MentoringPaymentLedgerRepository ledgerRepository;

    @Mock
    private MentoringTicketService ticketService;

    @Mock
    private RefundAccountResolver refundAccountResolver;

    @Mock
    private MentoringGroupService mentoringGroupService;

    @Mock
    private MentoringDisbursementService disbursementService;

    @Mock
    private MentorReputationService mentorReputationService;

    @Mock
    private MentoringTaskProposalCleaner proposalCleaner;

    private MentoringTaskResolutionServiceImpl resolutionService;
    private MentoringTaskCompletionServiceImpl completionService;

    private static final Long STUDENT_USER_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long TASK_ID = 100L;
    private static final Long EXTENSION_ID = 10L;
    private static final Long AMENDMENT_ID = 20L;
    private static final Long PROPOSAL_ID = 30L;
    private static final Long COMPLETION_ID = 40L;

    private User studentUser;
    private User mentorUser;
    private MentoringTask task;
    private Conversation conversation;
    private Validator validator;

    @BeforeEach
    void setUp() {
        resolutionService = new MentoringTaskResolutionServiceImpl(
                taskRepository,
                extensionRepository,
                amendmentRepository,
                settlementProposalRepository,
                userRepository,
                userProfileRepository,
                mentoringConversationService,
                notificationService,
                taskPaymentService,
                mentoringRules,
                ledgerRepository,
                ticketService,
                refundAccountResolver
        );

        completionService = new MentoringTaskCompletionServiceImpl(
                mentoringGroupService,
                taskRepository,
                completionRepository,
                userRepository,
                mentoringConversationService,
                disbursementService,
                mentorReputationService,
                proposalCleaner,
                notificationService
        );

        validator = Validation.buildDefaultValidatorFactory().getValidator();

        studentUser = User.builder().id(STUDENT_USER_ID).email("student@fpt.edu.vn").build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email("mentor@fpt.edu.vn").build();
        conversation = Conversation.builder().id(50L).build();

        task = MentoringTask.builder()
                .id(TASK_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .conversation(conversation)
                .status(MentoringTaskStatus.IN_PROGRESS)
                .taskScope("Xây dựng module thanh toán và xác thực")
                .expectedResult("Hoàn thiện hệ thống và tích hợp PayOS")
                .agreedPrice(BigDecimal.valueOf(1000000))
                .deadline(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
    }

    // ================= UTCID01 -> UTCID08: Deadline Extension =================

    @Test
    @DisplayName("UTCID01 - Task IN_PROGRESS; caller is mentor -> createDeadlineExtension -> Ticket PENDING, older superseded")
    void utcid01_createDeadlineExtension_ok() {
        // Given
        Instant newDeadline = task.getDeadline().plus(5, ChronoUnit.DAYS);
        CreateDeadlineExtensionRequest request = CreateDeadlineExtensionRequest.builder()
                .proposedDeadline(newDeadline)
                .reason("Cần thêm thời gian để hoàn thiện unit test và tài liệu")
                .build();

        MentoringTaskDeadlineExtension oldPending = MentoringTaskDeadlineExtension.builder()
                .id(9L).status(MentoringExtensionStatus.PENDING).build();
        MentoringTaskDeadlineExtension newExt = MentoringTaskDeadlineExtension.builder()
                .id(EXTENSION_ID).task(task).createdBy(mentorUser).recipient(studentUser)
                .currentDeadline(task.getDeadline()).proposedDeadline(newDeadline)
                .reason(request.getReason()).status(MentoringExtensionStatus.PENDING)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(extensionRepository.findByTaskIdAndStatus(TASK_ID, MentoringExtensionStatus.PENDING))
                .thenReturn(List.of(oldPending));
        when(extensionRepository.save(any(MentoringTaskDeadlineExtension.class))).thenReturn(newExt);

        // When
        MentoringTaskDeadlineExtensionResponse response = resolutionService.createDeadlineExtension(MENTOR_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(oldPending.getStatus()).isEqualTo(MentoringExtensionStatus.SUPERSEDED);
        verify(extensionRepository).save(oldPending);
        verify(extensionRepository, org.mockito.Mockito.times(2)).save(any(MentoringTaskDeadlineExtension.class));
    }

    @Test
    @DisplayName("UTCID02 - proposedDeadline <= current deadline -> createDeadlineExtension -> BadRequestException")
    void utcid02_createDeadlineExtension_badRequest() {
        // Given
        Instant earlierDeadline = task.getDeadline().minus(1, ChronoUnit.DAYS);
        CreateDeadlineExtensionRequest request = CreateDeadlineExtensionRequest.builder()
                .proposedDeadline(earlierDeadline)
                .reason("Gia hạn nhưng chọn ngày trước deadline hiện tại")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));

        // When + Then
        assertThatThrownBy(() -> resolutionService.createDeadlineExtension(MENTOR_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("Hạn chót đề xuất phải sau hạn chót hiện tại");
    }

    @Test
    @DisplayName("UTCID03 - reason with 9 characters -> Validation error")
    void utcid03_createDeadlineExtension_invalid() {
        // Given: reason with 9 characters (< 10)
        CreateDeadlineExtensionRequest request = CreateDeadlineExtensionRequest.builder()
                .proposedDeadline(Instant.now().plus(5, ChronoUnit.DAYS))
                .reason("123456789")
                .build();

        // When
        Set<ConstraintViolation<CreateDeadlineExtensionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().contains("Lý do gia hạn phải từ 10 đến 1000 ký tự"));
    }

    @Test
    @DisplayName("UTCID04 - Extension PENDING; caller is receiver -> respondDeadlineExtension(accept=true) -> Deadline updated, CONFIRMED")
    void utcid04_respondDeadlineExtension_ok() {
        // Given
        Instant newDeadline = task.getDeadline().plus(3, ChronoUnit.DAYS);
        MentoringTaskDeadlineExtension extension = MentoringTaskDeadlineExtension.builder()
                .id(EXTENSION_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .currentDeadline(task.getDeadline())
                .proposedDeadline(newDeadline)
                .status(MentoringExtensionStatus.PENDING)
                .build();

        RespondDeadlineExtensionRequest request = RespondDeadlineExtensionRequest.builder()
                .accept(true)
                .responseNote("Đồng ý gia hạn thêm 3 ngày")
                .build();

        when(extensionRepository.findById(EXTENSION_ID)).thenReturn(Optional.of(extension));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(extensionRepository.save(any(MentoringTaskDeadlineExtension.class))).thenReturn(extension);

        // When
        MentoringTaskDeadlineExtensionResponse response = resolutionService.respondDeadlineExtension(STUDENT_USER_ID, EXTENSION_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(extension.getStatus()).isEqualTo(MentoringExtensionStatus.CONFIRMED);
        assertThat(task.getDeadline()).isEqualTo(newDeadline);
        verify(taskRepository).save(task);
    }

    @Test
    @DisplayName("UTCID05 - Extension PENDING -> respondDeadlineExtension(accept=false) -> REJECTED, deadline unchanged")
    void utcid05_respondDeadlineExtension_ok() {
        // Given
        Instant originalDeadline = task.getDeadline();
        MentoringTaskDeadlineExtension extension = MentoringTaskDeadlineExtension.builder()
                .id(EXTENSION_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .currentDeadline(originalDeadline)
                .proposedDeadline(originalDeadline.plus(3, ChronoUnit.DAYS))
                .status(MentoringExtensionStatus.PENDING)
                .build();

        RespondDeadlineExtensionRequest request = RespondDeadlineExtensionRequest.builder()
                .accept(false)
                .responseNote("Cần hoàn thành đúng hạn để kịp báo cáo")
                .build();

        when(extensionRepository.findById(EXTENSION_ID)).thenReturn(Optional.of(extension));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(extensionRepository.save(any(MentoringTaskDeadlineExtension.class))).thenReturn(extension);

        // When
        MentoringTaskDeadlineExtensionResponse response = resolutionService.respondDeadlineExtension(STUDENT_USER_ID, EXTENSION_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(extension.getStatus()).isEqualTo(MentoringExtensionStatus.REJECTED);
        assertThat(task.getDeadline()).isEqualTo(originalDeadline);
        verify(taskRepository, never()).save(task);
    }

    @Test
    @DisplayName("UTCID06 - Extension already processed -> respondDeadlineExtension -> ConflictException")
    void utcid06_respondDeadlineExtension_conflict() {
        // Given
        MentoringTaskDeadlineExtension extension = MentoringTaskDeadlineExtension.builder()
                .id(EXTENSION_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .status(MentoringExtensionStatus.CONFIRMED)
                .build();

        RespondDeadlineExtensionRequest request = RespondDeadlineExtensionRequest.builder().accept(true).build();
        when(extensionRepository.findById(EXTENSION_ID)).thenReturn(Optional.of(extension));

        // When + Then
        assertThatThrownBy(() -> resolutionService.respondDeadlineExtension(STUDENT_USER_ID, EXTENSION_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Ticket gia hạn này đã được xử lý hoặc không còn hiệu lực.");
    }

    @Test
    @DisplayName("UTCID07 - Proposed deadline already passed -> respondDeadlineExtension(accept=true) -> ConflictException")
    void utcid07_respondDeadlineExtension_conflict() {
        // Given: proposed deadline in past
        Instant pastDeadline = Instant.now().minus(1, ChronoUnit.HOURS);
        MentoringTaskDeadlineExtension extension = MentoringTaskDeadlineExtension.builder()
                .id(EXTENSION_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .currentDeadline(task.getDeadline())
                .proposedDeadline(pastDeadline)
                .status(MentoringExtensionStatus.PENDING)
                .build();

        RespondDeadlineExtensionRequest request = RespondDeadlineExtensionRequest.builder().accept(true).build();
        when(extensionRepository.findById(EXTENSION_ID)).thenReturn(Optional.of(extension));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> resolutionService.respondDeadlineExtension(STUDENT_USER_ID, EXTENSION_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Hạn chót đề xuất đã qua. Mentor cần gửi đề xuất gia hạn mới.");
    }

    @Test
    @DisplayName("UTCID08 - Task COMPLETED -> createDeadlineExtension -> BadRequestException")
    void utcid08_createDeadlineExtension_badRequest() {
        // Given
        task.setStatus(MentoringTaskStatus.COMPLETED);
        CreateDeadlineExtensionRequest request = CreateDeadlineExtensionRequest.builder()
                .proposedDeadline(Instant.now().plus(5, ChronoUnit.DAYS))
                .reason("Cố tình tạo ticket gia hạn khi task đã xong")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        // When + Then
        assertThatThrownBy(() -> resolutionService.createDeadlineExtension(MENTOR_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Task đã hoàn thành, không thể thao tác.");
    }

    // ================= UTCID09 -> UTCID13: Task Amendment =================

    @Test
    @DisplayName("UTCID09 - Task IN_PROGRESS -> createTaskAmendment(additionalAmount=100000) -> Amendment PENDING")
    void utcid09_createTaskAmendment_ok() {
        // Given
        CreateTaskAmendmentRequest request = CreateTaskAmendmentRequest.builder()
                .newScope("Bổ sung tích hợp thanh toán qua VNPay bên cạnh PayOS")
                .newExpectedResult("Hoàn tất 2 cổng thanh toán")
                .additionalAmount(BigDecimal.valueOf(100000))
                .reason("Phát sinh yêu cầu mới từ phía học viên")
                .build();

        MentoringTaskAmendment amendment = MentoringTaskAmendment.builder()
                .id(AMENDMENT_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .version(1)
                .additionalAmount(BigDecimal.valueOf(100000))
                .status(MentoringAmendmentStatus.PENDING)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(amendmentRepository.countByTaskId(TASK_ID)).thenReturn(0L);
        when(amendmentRepository.save(any(MentoringTaskAmendment.class))).thenReturn(amendment);

        // When
        MentoringTaskAmendmentResponse response = resolutionService.createTaskAmendment(MENTOR_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(amendment.getStatus()).isEqualTo(MentoringAmendmentStatus.PENDING);
        verify(amendmentRepository).save(any(MentoringTaskAmendment.class));
    }

    @Test
    @DisplayName("UTCID10 - additionalAmount = -1 -> createTaskAmendment -> BadRequestException")
    void utcid10_createTaskAmendment_badRequest() {
        // Given
        CreateTaskAmendmentRequest request = CreateTaskAmendmentRequest.builder()
                .newScope("Thêm phạm vi")
                .additionalAmount(BigDecimal.valueOf(-1))
                .reason("Lý do điều chỉnh")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));

        // When + Then
        assertThatThrownBy(() -> resolutionService.createTaskAmendment(MENTOR_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Số tiền bổ sung không được âm.");
    }

    @Test
    @DisplayName("UTCID11 - amendment without any change -> createTaskAmendment -> BadRequestException")
    void utcid11_createTaskAmendment_badRequest() {
        // Given: same scope, same result, same deadline, zero additional amount
        CreateTaskAmendmentRequest request = CreateTaskAmendmentRequest.builder()
                .newScope(task.getTaskScope())
                .newExpectedResult(task.getExpectedResult())
                .additionalAmount(BigDecimal.ZERO)
                .reason("Không có thay đổi nào")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));

        // When + Then
        assertThatThrownBy(() -> resolutionService.createTaskAmendment(MENTOR_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Đề xuất điều chỉnh chưa có thay đổi nào so với Task hiện tại.");
    }

    @Test
    @DisplayName("UTCID12 - Amendment with extra amount -> respondTaskAmendment(accept=true) -> Amendment AWAITING_TOPUP")
    void utcid12_respondTaskAmendment_ok() {
        // Given
        MentoringTaskAmendment amendment = MentoringTaskAmendment.builder()
                .id(AMENDMENT_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .version(1)
                .additionalAmount(BigDecimal.valueOf(200000))
                .status(MentoringAmendmentStatus.PENDING)
                .build();

        RespondTaskAmendmentRequest request = RespondTaskAmendmentRequest.builder().accept(true).build();

        when(amendmentRepository.findById(AMENDMENT_ID)).thenReturn(Optional.of(amendment));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(amendmentRepository.save(any(MentoringTaskAmendment.class))).thenReturn(amendment);

        // When
        MentoringTaskAmendmentResponse response = resolutionService.respondTaskAmendment(STUDENT_USER_ID, AMENDMENT_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(amendment.getStatus()).isEqualTo(MentoringAmendmentStatus.AWAITING_TOPUP);
    }

    @Test
    @DisplayName("UTCID13 - Amendment without extra amount -> respondTaskAmendment(accept=true) -> Amendment APPLIED immediately")
    void utcid13_respondTaskAmendment_ok() {
        // Given: extra amount = 0, newScope
        MentoringTaskAmendment amendment = MentoringTaskAmendment.builder()
                .id(AMENDMENT_ID)
                .task(task)
                .createdBy(mentorUser)
                .recipient(studentUser)
                .version(1)
                .newScope("Phạm vi mới không tăng tiền")
                .additionalAmount(BigDecimal.ZERO)
                .status(MentoringAmendmentStatus.PENDING)
                .build();

        RespondTaskAmendmentRequest request = RespondTaskAmendmentRequest.builder().accept(true).build();

        when(amendmentRepository.findById(AMENDMENT_ID)).thenReturn(Optional.of(amendment));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(amendmentRepository.save(any(MentoringTaskAmendment.class))).thenReturn(amendment);

        // When
        MentoringTaskAmendmentResponse response = resolutionService.respondTaskAmendment(STUDENT_USER_ID, AMENDMENT_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(amendment.getStatus()).isEqualTo(MentoringAmendmentStatus.APPLIED);
        assertThat(task.getTaskScope()).isEqualTo("Phạm vi mới không tăng tiền");
        verify(taskRepository).save(task);
    }

    // ================= UTCID14 -> UTCID16: Settlement Proposal =================

    @Test
    @DisplayName("UTCID14 - Escrow 1,000,000 -> createSettlementProposal(mentor=600000, refund=400000) -> Proposal PENDING")
    void utcid14_createSettlementProposal_ok() {
        // Given
        BigDecimal escrow = BigDecimal.valueOf(1000000);
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(mentoringRules.escrowBalance(TASK_ID)).thenReturn(escrow);
        when(refundAccountResolver.exists(STUDENT_USER_ID)).thenReturn(true);

        CreateSettlementProposalRequest request = CreateSettlementProposalRequest.builder()
                .mentorAmount(BigDecimal.valueOf(600000))
                .studentRefund(BigDecimal.valueOf(400000))
                .reason("Hai bên thống nhất dừng giai đoạn 1")
                .build();

        MentoringTaskSettlementProposal proposal = MentoringTaskSettlementProposal.builder()
                .id(PROPOSAL_ID)
                .task(task)
                .createdBy(studentUser)
                .recipient(mentorUser)
                .mentorAmount(request.getMentorAmount())
                .studentRefund(request.getStudentRefund())
                .totalAmount(escrow)
                .status(MentoringSettlementProposalStatus.PENDING)
                .build();

        when(settlementProposalRepository.save(any(MentoringTaskSettlementProposal.class))).thenReturn(proposal);

        // When
        MentoringTaskSettlementProposalResponse response = resolutionService.createSettlementProposal(STUDENT_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(proposal.getStatus()).isEqualTo(MentoringSettlementProposalStatus.PENDING);
        verify(settlementProposalRepository).save(any(MentoringTaskSettlementProposal.class));
    }

    @Test
    @DisplayName("UTCID15 - Escrow 1,000,000 -> createSettlementProposal(mentor=600000, refund=300000) -> BadRequestException")
    void utcid15_createSettlementProposal_badRequest() {
        // Given: total 900,000 != escrow 1,000,000
        BigDecimal escrow = BigDecimal.valueOf(1000000);
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(mentoringRules.escrowBalance(TASK_ID)).thenReturn(escrow);
        when(refundAccountResolver.exists(STUDENT_USER_ID)).thenReturn(true);

        CreateSettlementProposalRequest request = CreateSettlementProposalRequest.builder()
                .mentorAmount(BigDecimal.valueOf(600000))
                .studentRefund(BigDecimal.valueOf(300000))
                .reason("Phân chia không khớp tổng quỹ")
                .build();

        // When + Then
        assertThatThrownBy(() -> resolutionService.createSettlementProposal(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("Tổng số tiền phân chia");
    }

    @Test
    @DisplayName("UTCID16 - Student has no refund account -> createSettlementProposal(refund > 0) -> BadRequestException")
    void utcid16_createSettlementProposal_badRequest() {
        // Given: refundAccountResolver returns false
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(refundAccountResolver.exists(STUDENT_USER_ID)).thenReturn(false);

        CreateSettlementProposalRequest request = CreateSettlementProposalRequest.builder()
                .mentorAmount(BigDecimal.valueOf(600000))
                .studentRefund(BigDecimal.valueOf(400000))
                .reason("Dừng task có hoàn tiền nhưng chưa khai báo tài khoản")
                .build();

        // When + Then
        assertThatThrownBy(() -> resolutionService.createSettlementProposal(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng khai báo tài khoản nhận hoàn tiền (mục Hoàn tiền) trước khi gửi hoặc đồng ý thỏa thuận dừng Task có hoàn tiền.");
    }

    // ================= UTCID17 -> UTCID23: Completion Service =================

    @Test
    @DisplayName("UTCID17 - Caller is task mentor; task IN_PROGRESS -> submitCompletion -> Completion SUBMITTED")
    void utcid17_submitCompletion_ok() {
        // Given
        SubmitTaskCompletionRequest request = SubmitTaskCompletionRequest.builder()
                .finalSummary("Đã hoàn thành toàn bộ mã nguồn backend, tích hợp API thanh toán và viết tài liệu HDSD")
                .deliverables("https://github.com/alumnect/release-v1.0")
                .attachmentUrls(Collections.emptyList())
                .build();

        MentoringTaskCompletion completion = MentoringTaskCompletion.builder()
                .id(COMPLETION_ID)
                .task(task)
                .submittedBy(mentorUser)
                .finalSummary(request.getFinalSummary())
                .status(MentoringCompletionStatus.PENDING)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(completionRepository.save(any(MentoringTaskCompletion.class))).thenReturn(completion);

        // When
        MentoringTaskCompletionResponse response = completionService.submitCompletion(MENTOR_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.SUBMITTED);
        verify(taskRepository).save(task);
        verify(completionRepository).save(any(MentoringTaskCompletion.class));
    }

    @Test
    @DisplayName("UTCID18 - Caller is the student -> submitCompletion -> ForbiddenException")
    void utcid18_submitCompletion_forbidden() {
        // Given: student tries to submit completion
        SubmitTaskCompletionRequest request = SubmitTaskCompletionRequest.builder()
                .finalSummary("Học viên tự nộp nghiệm thu")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> completionService.submitCompletion(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ Cố vấn (Mentor) phụ trách nhiệm vụ này mới có quyền nộp kết quả nghiệm thu.");
    }

    @Test
    @DisplayName("UTCID19 - Task IN_PROGRESS -> finalSummary with 10 / 3000 characters -> Completion saved")
    void utcid19_submitCompletion_ok() {
        // Given: boundary lengths (10 chars min, 3000 chars max)
        String maxSummary = "A".repeat(3000);
        SubmitTaskCompletionRequest request = SubmitTaskCompletionRequest.builder()
                .finalSummary(maxSummary)
                .deliverables("Bàn giao hoàn tất")
                .build();

        MentoringTaskCompletion completion = MentoringTaskCompletion.builder()
                .id(COMPLETION_ID)
                .task(task)
                .submittedBy(mentorUser)
                .finalSummary(maxSummary)
                .status(MentoringCompletionStatus.PENDING)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(completionRepository.save(any(MentoringTaskCompletion.class))).thenReturn(completion);

        // When
        MentoringTaskCompletionResponse response = completionService.submitCompletion(MENTOR_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        verify(completionRepository).save(any(MentoringTaskCompletion.class));
    }

    @Test
    @DisplayName("UTCID20 - Task IN_PROGRESS -> finalSummary with 3001 characters -> Validation error")
    void utcid20_submitCompletion_invalid() {
        // Given: 3001 characters (> 3000)
        SubmitTaskCompletionRequest request = SubmitTaskCompletionRequest.builder()
                .finalSummary("X".repeat(3001))
                .build();

        // When
        Set<ConstraintViolation<SubmitTaskCompletionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().contains("Mô tả kết quả cuối cùng không vượt quá 3000 ký tự"));
    }

    @Test
    @DisplayName("UTCID21 - Completion PENDING; caller is student -> respondCompletion(accept=true) -> Task COMPLETED, payout queued")
    void utcid21_respondCompletion_ok() {
        // Given
        MentoringTaskCompletion completion = MentoringTaskCompletion.builder()
                .id(COMPLETION_ID)
                .task(task)
                .submittedBy(mentorUser)
                .status(MentoringCompletionStatus.PENDING)
                .build();

        RespondTaskCompletionRequest request = RespondTaskCompletionRequest.builder()
                .accept(true)
                .feedbackNote("Mentor hướng dẫn rất tận tâm, sản phẩm hoàn thiện đúng yêu cầu!")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(completionRepository.findById(COMPLETION_ID)).thenReturn(Optional.of(completion));

        // When
        MentoringTaskCompletionResponse response = completionService.respondCompletion(STUDENT_USER_ID, TASK_ID, COMPLETION_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.COMPLETED);
        assertThat(completion.getStatus()).isEqualTo(MentoringCompletionStatus.CONFIRMED);
        verify(taskRepository).save(task);
        verify(completionRepository).save(completion);
        verify(mentorReputationService).recordTaskCompleted(mentorUser);
        verify(disbursementService).disbursePayout(eq(STUDENT_USER_ID), eq(TASK_ID), anyString());
    }

    @Test
    @DisplayName("UTCID22 - Completion PENDING -> respondCompletion(accept=false, reason) -> Completion rejected with reason")
    void utcid22_respondCompletion_ok() {
        // Given
        MentoringTaskCompletion completion = MentoringTaskCompletion.builder()
                .id(COMPLETION_ID)
                .task(task)
                .submittedBy(mentorUser)
                .status(MentoringCompletionStatus.PENDING)
                .build();

        RespondTaskCompletionRequest request = RespondTaskCompletionRequest.builder()
                .accept(false)
                .feedbackNote("Chưa có unit tests và tài liệu swagger")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(completionRepository.findById(COMPLETION_ID)).thenReturn(Optional.of(completion));

        // When
        MentoringTaskCompletionResponse response = completionService.respondCompletion(STUDENT_USER_ID, TASK_ID, COMPLETION_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.IN_PROGRESS);
        assertThat(completion.getStatus()).isEqualTo(MentoringCompletionStatus.REJECTED);
        assertThat(completion.getFeedbackNote()).isEqualTo("Chưa có unit tests và tài liệu swagger");
        verify(taskRepository).save(task);
        verify(completionRepository).save(completion);
        verify(disbursementService, never()).disbursePayout(any(), any(), any());
    }

    @Test
    @DisplayName("UTCID23 - Completion not PENDING -> respondCompletion -> ConflictException")
    void utcid23_respondCompletion_conflict() {
        // Given: status is already CONFIRMED
        MentoringTaskCompletion completion = MentoringTaskCompletion.builder()
                .id(COMPLETION_ID)
                .task(task)
                .submittedBy(mentorUser)
                .status(MentoringCompletionStatus.CONFIRMED)
                .build();

        RespondTaskCompletionRequest request = RespondTaskCompletionRequest.builder().accept(true).build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(completionRepository.findById(COMPLETION_ID)).thenReturn(Optional.of(completion));

        // When + Then
        assertThatThrownBy(() -> completionService.respondCompletion(STUDENT_USER_ID, TASK_ID, COMPLETION_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Biên bản nghiệm thu này không ở trạng thái chờ phản hồi (PENDING).");
    }
}
