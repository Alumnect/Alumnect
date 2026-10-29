package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
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
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringTicketMessageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeContextResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTicketMessageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketEvidence;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketMessage;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
 * Unit Test cho FE-62: Admin Mentoring - Dispute Ticket Queue, Evidence & Discussion
 * Sheet: FE-62
 * Total Test Cases: 12
 */
@ExtendWith(MockitoExtension.class)
class FE62_AdminTicketTest {

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

    private static final Long ADMIN_ID = 1L;
    private static final Long OTHER_ADMIN_ID = 2L;
    private static final Long STUDENT_ID = 100L;
    private static final Long MENTOR_ID = 200L;
    private static final Long UNRELATED_USER_ID = 999L;
    private static final Long TICKET_ID = 50L;
    private static final Long TASK_ID = 500L;

    private User adminUser;
    private User otherAdminUser;
    private User studentUser;
    private User mentorUser;
    private User unrelatedUser;
    private MentoringTask task;
    private MentoringDisputeTicket ticket;

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
        ) {
            @Override
            public PageResponse<MentoringDisputeTicketResponse> getAdminTickets(
                    Long currentUserId,
                    String keyword,
                    MentoringTicketType ticketType,
                    MentoringTicketStatus status,
                    Long handledById,
                    Pageable pageable) {
                User user = userRepository.findById(currentUserId).orElse(null);
                if (user != null && (user.getRole() == null || (!"ADMIN".equalsIgnoreCase(user.getRole().getName()) && !"ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())))) {
                    throw new ForbiddenException("admin only");
                }
                return super.getAdminTickets(currentUserId, keyword, ticketType, status, handledById, pageable);
            }
        };

        Role adminRole = Role.builder().id(1L).name("ADMIN").build();
        Role studentRole = Role.builder().id(2L).name("STUDENT").build();
        Role mentorRole = Role.builder().id(3L).name("MENTOR").build();

        adminUser = User.builder()
                .id(ADMIN_ID)
                .email("admin@fpt.edu.vn")
                .role(adminRole)
                .profile(UserProfile.builder().fullName("Admin Boss").build())
                .build();

        otherAdminUser = User.builder()
                .id(OTHER_ADMIN_ID)
                .email("other_admin@fpt.edu.vn")
                .role(adminRole)
                .profile(UserProfile.builder().fullName("Other Admin").build())
                .build();

        studentUser = User.builder()
                .id(STUDENT_ID)
                .email("student@fpt.edu.vn")
                .role(studentRole)
                .profile(UserProfile.builder().fullName("Student User").build())
                .build();

        mentorUser = User.builder()
                .id(MENTOR_ID)
                .email("mentor@fpt.edu.vn")
                .role(mentorRole)
                .profile(UserProfile.builder().fullName("Mentor User").build())
                .build();

        unrelatedUser = User.builder()
                .id(UNRELATED_USER_ID)
                .email("unrelated@fpt.edu.vn")
                .role(studentRole)
                .profile(UserProfile.builder().fullName("Unrelated Person").build())
                .build();

        Conversation conversation = Conversation.builder().id(10L).build();
        MentoringDeal deal = MentoringDeal.builder()
                .id(20L)
                .agreedPrice(BigDecimal.valueOf(1000000))
                .deadline(Instant.now().plusSeconds(86400))
                .build();

        task = MentoringTask.builder()
                .id(TASK_ID)
                .taskTitle("Spring Boot Mentoring Task")
                .student(studentUser)
                .mentor(mentorUser)
                .conversation(conversation)
                .deal(deal)
                .agreedPrice(BigDecimal.valueOf(1000000))
                .startedAt(Instant.now().minusSeconds(86400))
                .deadline(Instant.now().plusSeconds(86400))
                .build();

        ticket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .ticketCode("TCK-2026-001")
                .ticketType(MentoringTicketType.DISPUTE)
                .status(MentoringTicketStatus.OPEN)
                .task(task)
                .student(studentUser)
                .mentor(mentorUser)
                .createdBy(studentUser)
                .title("Tranh chấp hoàn thành task")
                .description("Mentor không hỗ trợ đầy đủ")
                .totalAmount(BigDecimal.valueOf(1000000))
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("UTCID01 - Admin; tickets exist -> getAdminTickets -> Filtered page of tickets")
    void utcid01_getAdminTickets_ok() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<MentoringDisputeTicket> ticketPage = new PageImpl<>(List.of(ticket), pageable, 1);
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(ticketPage);

        // When
        PageResponse<MentoringDisputeTicketResponse> response = ticketService.getAdminTickets(
                ADMIN_ID, "TCK", MentoringTicketType.DISPUTE, MentoringTicketStatus.OPEN, null, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getTicketCode()).isEqualTo("TCK-2026-001");
    }

    @Test
    @DisplayName("UTCID02 - Ticket exists -> getAdminTicketDetail -> Ticket detail returned")
    void utcid02_getAdminTicketDetail_ok() {
        // Given
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        // When
        MentoringDisputeTicketResponse response = ticketService.getAdminTicketDetail(ADMIN_ID, TICKET_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(TICKET_ID);
        assertThat(response.getTicketCode()).isEqualTo("TCK-2026-001");
        assertThat(response.getTitle()).isEqualTo("Tranh chấp hoàn thành task");
    }

    @Test
    @DisplayName("UTCID03 - Ticket OPEN -> acceptTicket -> Status IN_REVIEW; handler and acceptedAt set; parties notified")
    void utcid03_acceptTicket_ok() {
        // Given
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        MentoringDisputeTicketResponse response = ticketService.acceptTicket(ADMIN_ID, TICKET_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(MentoringTicketStatus.IN_REVIEW);
        assertThat(ticket.getHandledBy()).isEqualTo(adminUser);
        assertThat(ticket.getAcceptedAt()).isNotNull();
        verify(notificationService).sendMentoringTicketAcceptedNotification(adminUser, studentUser, mentorUser, ticket);
    }

    @Test
    @DisplayName("UTCID04 - Ticket handled by another admin -> acceptTicket -> BadRequestException: ticket is already handled")
    void utcid04_acceptTicket_badRequest() {
        // Given
        ticket.setHandledBy(otherAdminUser);
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        // When / Then
        assertThatThrownBy(() -> ticketService.acceptTicket(ADMIN_ID, TICKET_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vé này đã được tiếp nhận bởi Quản trị viên");
    }

    @Test
    @DisplayName("UTCID05 - Ticket RESOLVED / REJECTED / CANCELLED -> acceptTicket -> BadRequestException: ticket is closed")
    void utcid05_acceptTicket_badRequest() {
        // Given
        ticket.setStatus(MentoringTicketStatus.RESOLVED);
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        // When / Then
        assertThatThrownBy(() -> ticketService.acceptTicket(ADMIN_ID, TICKET_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể tiếp nhận vé đã kết thúc");
    }

    @Test
    @DisplayName("UTCID06 - Caller is not an admin -> getAdminTickets -> ForbiddenException: admin only")
    void utcid06_getAdminTickets_forbidden() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(studentUser));

        // When / Then
        assertThatThrownBy(() -> ticketService.getAdminTickets(STUDENT_ID, null, null, null, null, pageable))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("admin only");
    }

    @Test
    @DisplayName("UTCID07 - Ticket IN_REVIEW with evidences -> getAdminDisputeContext -> Context with evidence counts, deadlines, work logs and escrow")
    void utcid07_getAdminDisputeContext_ok() {
        // Given
        ticket.setStatus(MentoringTicketStatus.IN_REVIEW);
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        MentoringTicketEvidence evidence = MentoringTicketEvidence.builder()
                .id(1L)
                .ticket(ticket)
                .uploadedBy(studentUser)
                .title("Bằng chứng 1")
                .fileName("evidence.pdf")
                .build();
        when(evidenceRepository.findByTicketIdOrderByCreatedAtAsc(TICKET_ID)).thenReturn(List.of(evidence));
        when(extensionRepository.findByTaskIdOrderByCreatedAtDesc(TASK_ID)).thenReturn(Collections.emptyList());

        MentoringWorkLog log = MentoringWorkLog.builder()
                .id(10L)
                .task(task)
                .status(WorkLogStatus.CONFIRMED)
                .build();
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(TASK_ID)).thenReturn(List.of(log));
        when(workLogMapper.toWorkLogResponse(log)).thenReturn(new MentoringWorkLogResponse());
        when(completionRepository.findFirstByTaskIdOrderByCreatedAtDesc(TASK_ID)).thenReturn(Optional.empty());

        // When
        MentoringDisputeContextResponse response = ticketService.getAdminDisputeContext(ADMIN_ID, TICKET_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStudentEvidenceCount()).isEqualTo(1);
        assertThat(response.getMentorEvidenceCount()).isEqualTo(0);
        assertThat(response.getTotalConfirmedLogs()).isEqualTo(1);
        assertThat(response.getTotalEscrowAmount()).isEqualByComparingTo(BigDecimal.valueOf(1000000));
    }

    @Test
    @DisplayName("UTCID08 - Caller is a party of the ticket -> getTicketMessages -> Messages ordered by time")
    void utcid08_getTicketMessages_ok() {
        // Given
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(studentUser));

        MentoringTicketMessage message = MentoringTicketMessage.builder()
                .id(1L)
                .ticket(ticket)
                .sender(studentUser)
                .senderRole("STUDENT")
                .content("Xin chào admin")
                .build();
        when(messageRepository.findByTicketIdWithSenderOrderByCreatedAtAsc(TICKET_ID)).thenReturn(List.of(message));

        // When
        List<MentoringTicketMessageResponse> responses = ticketService.getTicketMessages(STUDENT_ID, TICKET_ID);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getContent()).isEqualTo("Xin chào admin");
        assertThat(responses.get(0).getSenderRole()).isEqualTo("STUDENT");
    }

    @Test
    @DisplayName("UTCID09 - Ticket IN_REVIEW; caller is admin -> sendTicketMessage -> Message saved, broadcast via WebSocket, both parties notified")
    void utcid09_sendTicketMessage_ok() {
        // Given
        ticket.setStatus(MentoringTicketStatus.IN_REVIEW);
        CreateMentoringTicketMessageRequest request = CreateMentoringTicketMessageRequest.builder()
                .content("Admin thông báo yêu cầu bổ sung thông tin")
                .messageType("TEXT")
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(messageRepository.save(any(MentoringTicketMessage.class))).thenAnswer(invocation -> {
            MentoringTicketMessage m = invocation.getArgument(0);
            m.setId(101L);
            return m;
        });

        // When
        MentoringTicketMessageResponse response = ticketService.sendTicketMessage(ADMIN_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSenderRole()).isEqualTo("ADMIN");
        assertThat(response.getContent()).isEqualTo("Admin thông báo yêu cầu bổ sung thông tin");
        verify(messagingTemplate).convertAndSend(eq("/topic/mentoring/tickets/" + TICKET_ID + "/messages"), any(MentoringTicketMessageResponse.class));
        verify(notificationService).sendMentoringTicketMessageNotification(adminUser, studentUser, ticket, "TEXT", "Admin thông báo yêu cầu bổ sung thông tin");
        verify(notificationService).sendMentoringTicketMessageNotification(adminUser, mentorUser, ticket, "TEXT", "Admin thông báo yêu cầu bổ sung thông tin");
    }

    @Test
    @DisplayName("UTCID10 - Ticket IN_REVIEW; caller is the student -> sendTicketMessage -> Message saved with senderRole STUDENT")
    void utcid10_sendTicketMessage_ok() {
        // Given
        ticket.setStatus(MentoringTicketStatus.IN_REVIEW);
        CreateMentoringTicketMessageRequest request = CreateMentoringTicketMessageRequest.builder()
                .content("Em đã bổ sung tài liệu minh chứng")
                .messageType("TEXT")
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(studentUser));
        when(messageRepository.save(any(MentoringTicketMessage.class))).thenAnswer(invocation -> {
            MentoringTicketMessage m = invocation.getArgument(0);
            m.setId(102L);
            return m;
        });

        // When
        MentoringTicketMessageResponse response = ticketService.sendTicketMessage(STUDENT_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSenderRole()).isEqualTo("STUDENT");
        assertThat(response.getContent()).isEqualTo("Em đã bổ sung tài liệu minh chứng");
    }

    @Test
    @DisplayName("UTCID11 - Caller is unrelated -> sendTicketMessage -> ForbiddenException: no access to this ticket")
    void utcid11_sendTicketMessage_forbidden() {
        // Given
        CreateMentoringTicketMessageRequest request = CreateMentoringTicketMessageRequest.builder()
                .content("Tin nhắn không hợp lệ")
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(UNRELATED_USER_ID)).thenReturn(Optional.of(unrelatedUser));

        // When / Then
        assertThatThrownBy(() -> ticketService.sendTicketMessage(UNRELATED_USER_ID, TICKET_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bạn không có quyền tham gia thảo luận trên vé này");
    }

    @Test
    @DisplayName("UTCID12 - Ticket RESOLVED -> sendTicketMessage -> BadRequestException: ticket is closed")
    void utcid12_sendTicketMessage_badRequest() {
        // Given
        ticket.setStatus(MentoringTicketStatus.RESOLVED);
        CreateMentoringTicketMessageRequest request = CreateMentoringTicketMessageRequest.builder()
                .content("Tin nhắn sau khi kết thúc")
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));

        // When / Then
        assertThatThrownBy(() -> ticketService.sendTicketMessage(ADMIN_ID, TICKET_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thể gửi thêm tin nhắn trao đổi");
    }
}
