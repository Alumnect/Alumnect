package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDisputeTicketRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskCompletionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketEvidenceRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketMessageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateDisputeTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitSettlementTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.TicketEvidenceRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringSettlementSnapshotResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTicketEvidenceResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketEvidence;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentorReputationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDisbursementService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskProposalCleaner;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTicketServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit Test Suite cho FE-59: Mentoring - Settlement Ticket & Dispute Ticket
 * Tổng cộng 13 Test Cases (UTCID01 -> UTCID13).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-59 Mentoring - Settlement Ticket & Dispute Ticket")
class FE59_MentoringTicketDisputeTest {

    @Mock
    private MentoringDisputeTicketRepository ticketRepository;

    @Mock
    private MentoringTaskRepository taskRepository;

    @Mock
    private MentoringTaskSettlementProposalRepository proposalRepository;

    @Mock
    private MentoringTicketEvidenceRepository evidenceRepository;

    @Mock
    private MentoringTicketMessageRepository messageRepository;

    @Mock
    private MentoringPaymentLedgerRepository ledgerRepository;

    @Mock
    private MentoringDisbursementService disbursementService;

    @Mock
    private MentoringRules mentoringRules;

    @Mock
    private MentorReputationService mentorReputationService;

    @Mock
    private MentoringTaskProposalCleaner proposalCleaner;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MentoringConversationService mentoringConversationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MentoringTaskDeadlineExtensionRepository extensionRepository;

    @Mock
    private MentoringWorkLogRepository workLogRepository;

    @Mock
    private MentoringTaskCompletionRepository completionRepository;

    @Mock
    private MentoringWorkLogMapper workLogMapper;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private MentoringTicketServiceImpl ticketService;

    private static final Long STUDENT_USER_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long OTHER_USER_ID = 99L;
    private static final Long TASK_ID = 100L;
    private static final Long PROPOSAL_ID = 200L;
    private static final Long TICKET_ID = 300L;

    private User studentUser;
    private User mentorUser;
    private MentoringTask task;
    private MentoringTaskSettlementProposal proposal;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        ticketService = new MentoringTicketServiceImpl(
                ticketRepository,
                taskRepository,
                proposalRepository,
                evidenceRepository,
                messageRepository,
                ledgerRepository,
                disbursementService,
                mentoringRules,
                mentorReputationService,
                proposalCleaner,
                mentorProfileRepository,
                userRepository,
                mentoringConversationService,
                notificationService,
                extensionRepository,
                workLogRepository,
                completionRepository,
                workLogMapper,
                messagingTemplate
        );

        studentUser = User.builder().id(STUDENT_USER_ID).email("student@fpt.edu.vn").build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email("mentor@fpt.edu.vn").build();
        conversation = Conversation.builder().id(50L).build();

        task = MentoringTask.builder()
                .id(TASK_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .conversation(conversation)
                .deal(MentoringDeal.builder().id(500L).conversation(conversation).build())
                .status(MentoringTaskStatus.IN_PROGRESS)
                .taskTitle("Xây dựng module thanh toán")
                .agreedPrice(BigDecimal.valueOf(1000000))
                .build();

        proposal = MentoringTaskSettlementProposal.builder()
                .id(PROPOSAL_ID)
                .task(task)
                .createdBy(studentUser)
                .recipient(mentorUser)
                .mentorAmount(BigDecimal.valueOf(600000))
                .studentRefund(BigDecimal.valueOf(400000))
                .totalAmount(BigDecimal.valueOf(1000000))
                .reason("Hai bên thống nhất kết thúc sớm giai đoạn 1")
                .status(MentoringSettlementProposalStatus.ACCEPTED)
                .build();
    }

    // ================= UTCID01 -> UTCID06: Settlement Snapshot & Ticket =================

    @Test
    @DisplayName("UTCID01 - Participant of the task -> getSettlementSnapshot -> Escrow, mentor amount, refund returned")
    void utcid01_getSettlementSnapshot_ok() {
        // Given
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(proposalRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(TASK_ID, MentoringSettlementProposalStatus.ACCEPTED))
                .thenReturn(Optional.of(proposal));
        when(ticketRepository.existsByTaskIdAndStatusIn(eq(TASK_ID), any())).thenReturn(false);

        // When
        MentoringSettlementSnapshotResponse response = ticketService.getSettlementSnapshot(STUDENT_USER_ID, TASK_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTaskId()).isEqualTo(TASK_ID);
        assertThat(response.getMentorAmount()).isEqualTo(BigDecimal.valueOf(600000));
        assertThat(response.getStudentRefund()).isEqualTo(BigDecimal.valueOf(400000));
        assertThat(response.getIsAgreed()).isTrue();
    }

    @Test
    @DisplayName("UTCID02 - Proposal ACCEPTED; amounts equal escrow -> submitSettlementTicket -> Ticket ST- OPEN; task CANCELLED")
    void utcid02_submitSettlementTicket_ok() {
        // Given
        SubmitSettlementTicketRequest request = SubmitSettlementTicketRequest.builder()
                .proposalId(PROPOSAL_ID)
                .note("Đồng thuận dừng Task và giải ngân")
                .build();

        MentoringDisputeTicket savedTicket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .ticketCode("ST-20261029-ABCD12")
                .ticketType(MentoringTicketType.SETTLEMENT)
                .status(MentoringTicketStatus.OPEN)
                .task(task)
                .student(studentUser)
                .mentor(mentorUser)
                .mentorAmount(proposal.getMentorAmount())
                .studentRefund(proposal.getStudentRefund())
                .totalAmount(proposal.getTotalAmount())
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(proposalRepository.findById(PROPOSAL_ID)).thenReturn(Optional.of(proposal));
        when(ticketRepository.existsByTaskIdAndStatusIn(eq(TASK_ID), any())).thenReturn(false);
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenReturn(savedTicket);

        // When
        MentoringDisputeTicketResponse response = ticketService.submitSettlementTicket(STUDENT_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.CANCELLED);
        verify(taskRepository).save(task);
        verify(ticketRepository).save(any(MentoringDisputeTicket.class));
    }

    @Test
    @DisplayName("UTCID03 - Proposal still pending -> submitSettlementTicket -> ConflictException")
    void utcid03_submitSettlementTicket_conflict() {
        // Given: proposal status is PENDING (not ACCEPTED)
        proposal.setStatus(MentoringSettlementProposalStatus.PENDING);
        SubmitSettlementTicketRequest request = SubmitSettlementTicketRequest.builder()
                .proposalId(PROPOSAL_ID)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(proposalRepository.findById(PROPOSAL_ID)).thenReturn(Optional.of(proposal));

        // When + Then
        assertThatThrownBy(() -> ticketService.submitSettlementTicket(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Thỏa thuận phân chia tiền chưa được cả hai bên xác nhận đồng thuận.");
    }

    @Test
    @DisplayName("UTCID04 - Proposal belongs to another task -> submitSettlementTicket -> BadRequestException")
    void utcid04_submitSettlementTicket_badRequest() {
        // Given: proposal belongs to task ID 999
        MentoringTask otherTask = MentoringTask.builder().id(999L).build();
        proposal.setTask(otherTask);

        SubmitSettlementTicketRequest request = SubmitSettlementTicketRequest.builder()
                .proposalId(PROPOSAL_ID)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(proposalRepository.findById(PROPOSAL_ID)).thenReturn(Optional.of(proposal));

        // When + Then
        assertThatThrownBy(() -> ticketService.submitSettlementTicket(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thỏa thuận phân chia tiền không thuộc về nhiệm vụ Task được chỉ định.");
    }

    @Test
    @DisplayName("UTCID05 - Proposal id 99 does not exist -> submitSettlementTicket -> ResourceNotFoundException")
    void utcid05_submitSettlementTicket_notFound() {
        // Given
        SubmitSettlementTicketRequest request = SubmitSettlementTicketRequest.builder()
                .proposalId(99L)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(proposalRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> ticketService.submitSettlementTicket(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy thỏa thuận phân chia tiền với ID: 99");
    }

    @Test
    @DisplayName("UTCID06 - Active ticket exists -> submitSettlementTicket -> ConflictException")
    void utcid06_submitSettlementTicket_conflict() {
        // Given: ticketRepository returns true for active tickets
        SubmitSettlementTicketRequest request = SubmitSettlementTicketRequest.builder()
                .proposalId(PROPOSAL_ID)
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(proposalRepository.findById(PROPOSAL_ID)).thenReturn(Optional.of(proposal));
        when(ticketRepository.existsByTaskIdAndStatusIn(eq(TASK_ID), any())).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> ticketService.submitSettlementTicket(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Nhiệm vụ này đã có một Ticket đang chờ Ban Quản Trị tiếp nhận xử lý.");
    }

    // ================= UTCID07 -> UTCID10: Dispute Ticket =================

    @Test
    @DisplayName("UTCID07 - Task IN_PROGRESS; participant -> createDisputeTicket -> Ticket DP- OPEN; task DISPUTED; evidence saved")
    void utcid07_createDisputeTicket_ok() {
        // Given
        TicketEvidenceRequest evidenceReq = TicketEvidenceRequest.builder()
                .title("Ảnh chụp màn hình lỗi")
                .fileUrl("https://storage.alumnect.com/evidence1.png")
                .fileName("evidence1.png")
                .fileSize(204800L)
                .fileType("image/png")
                .build();

        CreateDisputeTicketRequest request = CreateDisputeTicketRequest.builder()
                .title("Mentor không tham gia buổi hướng dẫn và không phản hồi")
                .description("Đã 5 ngày không liên lạc được mặc dù deadline sắp đến")
                .disputeReason("Mentor vắng mặt không lý do")
                .desiredSolution("Hoàn trả 100% chi phí ký quỹ")
                .initialEvidences(List.of(evidenceReq))
                .build();

        MentoringDisputeTicket savedTicket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .ticketCode("DP-20261029-123456")
                .ticketType(MentoringTicketType.DISPUTE)
                .status(MentoringTicketStatus.OPEN)
                .task(task)
                .student(studentUser)
                .mentor(mentorUser)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        MentoringTicketEvidence savedEvidence = MentoringTicketEvidence.builder()
                .id(1L)
                .ticket(savedTicket)
                .title("Ảnh chụp màn hình lỗi")
                .fileUrl("https://storage.alumnect.com/evidence1.png")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(ticketRepository.existsByTaskIdAndStatusIn(eq(TASK_ID), any())).thenReturn(false);
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenReturn(savedTicket);
        when(evidenceRepository.save(any(MentoringTicketEvidence.class))).thenReturn(savedEvidence);

        // When
        MentoringDisputeTicketResponse response = ticketService.createDisputeTicket(STUDENT_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.DISPUTED);
        verify(taskRepository).save(task);
        verify(evidenceRepository).save(any(MentoringTicketEvidence.class));
    }

    @Test
    @DisplayName("UTCID08 - Task COMPLETED -> createDisputeTicket -> BadRequestException")
    void utcid08_createDisputeTicket_badRequest() {
        // Given
        task.setStatus(MentoringTaskStatus.COMPLETED);
        CreateDisputeTicketRequest request = CreateDisputeTicketRequest.builder()
                .title("Khiếu nại sau khi đã hoàn thành")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> ticketService.createDisputeTicket(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Nhiệm vụ đã hoàn thành thành công, không thể tạo khiếu nại tranh chấp.");
    }

    @Test
    @DisplayName("UTCID09 - Active ticket exists -> createDisputeTicket -> ConflictException")
    void utcid09_createDisputeTicket_conflict() {
        // Given
        CreateDisputeTicketRequest request = CreateDisputeTicketRequest.builder()
                .title("Tạo khiếu nại trùng")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(ticketRepository.existsByTaskIdAndStatusIn(eq(TASK_ID), any())).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> ticketService.createDisputeTicket(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Nhiệm vụ này đã có một Ticket đang chờ Ban Quản Trị tiếp nhận xử lý.");
    }

    @Test
    @DisplayName("UTCID10 - Caller is not a participant -> createDisputeTicket -> ForbiddenException")
    void utcid10_createDisputeTicket_forbidden() {
        // Given
        CreateDisputeTicketRequest request = CreateDisputeTicketRequest.builder()
                .title("Người ngoài khiếu nại")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        // When + Then
        assertThatThrownBy(() -> ticketService.createDisputeTicket(OTHER_USER_ID, TASK_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền truy cập thông tin của nhiệm vụ này.");
    }

    // ================= UTCID11 -> UTCID13: Ticket Evidences =================

    @Test
    @DisplayName("UTCID11 - Ticket OPEN; participant -> addTicketEvidence -> Evidence saved and system message posted")
    void utcid11_addTicketEvidence_ok() {
        // Given
        MentoringDisputeTicket ticket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .task(task)
                .student(studentUser)
                .mentor(mentorUser)
                .createdBy(studentUser)
                .status(MentoringTicketStatus.OPEN)
                .build();

        TicketEvidenceRequest request = TicketEvidenceRequest.builder()
                .title("Minh chứng đoạn chat trao đổi")
                .fileUrl("https://storage.alumnect.com/chat-proof.png")
                .fileName("chat-proof.png")
                .fileSize(102400L)
                .fileType("image/png")
                .build();

        MentoringTicketEvidence evidence = MentoringTicketEvidence.builder()
                .id(1L)
                .ticket(ticket)
                .title(request.getTitle())
                .fileUrl(request.getFileUrl())
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(evidenceRepository.save(any(MentoringTicketEvidence.class))).thenReturn(evidence);

        // When
        MentoringTicketEvidenceResponse response = ticketService.addTicketEvidence(STUDENT_USER_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        verify(evidenceRepository).save(any(MentoringTicketEvidence.class));
    }

    @Test
    @DisplayName("UTCID12 - Ticket RESOLVED -> addTicketEvidence -> BadRequestException")
    void utcid12_addTicketEvidence_badRequest() {
        // Given
        MentoringDisputeTicket ticket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .task(task)
                .student(studentUser)
                .mentor(mentorUser)
                .createdBy(studentUser)
                .status(MentoringTicketStatus.RESOLVED)
                .build();

        TicketEvidenceRequest request = TicketEvidenceRequest.builder()
                .title("Bổ sung khi ticket đã đóng")
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> ticketService.addTicketEvidence(STUDENT_USER_ID, TICKET_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ticket này đã ở trạng thái RESOLVED, không thể bổ sung thêm bằng chứng.");
    }

    @Test
    @DisplayName("UTCID13 - Caller is not a participant -> getTicketEvidences -> ForbiddenException")
    void utcid13_getTicketEvidences_forbidden() {
        // Given
        MentoringDisputeTicket ticket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .createdBy(studentUser)
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        // When + Then
        assertThatThrownBy(() -> ticketService.getTicketEvidences(OTHER_USER_ID, TICKET_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền truy cập bằng chứng của Ticket này.");
    }
}
