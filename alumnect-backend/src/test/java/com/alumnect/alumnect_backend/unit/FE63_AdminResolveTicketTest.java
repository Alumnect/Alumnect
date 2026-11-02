package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketDecision;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDisputeTicketRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskCompletionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketEvidenceRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketMessageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.AdminResolveTicketRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.AdminTaskFundDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.AdminTaskFundSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketMessage;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentorReputationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDisbursementService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringFinanceServiceImpl;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit Test cho FE-63: Admin Mentoring - Resolve Ticket & Financial Ledgers
 * Sheet: FE-63
 * Total Test Cases: 11
 */
@ExtendWith(MockitoExtension.class)
class FE63_AdminResolveTicketTest {

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
    private MentoringTaskAmendmentRepository amendmentRepository;
    @Mock
    private MentoringWorkLogRepository workLogRepository;
    @Mock
    private MentoringTaskCompletionRepository completionRepository;
    @Mock
    private MentoringWorkLogMapper workLogMapper;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private MentoringTicketServiceImpl ticketService;
    private MentoringFinanceServiceImpl financeService;

    private static final Long ADMIN_ID = 1L;
    private static final Long OTHER_ADMIN_ID = 2L;
    private static final Long STUDENT_ID = 100L;
    private static final Long MENTOR_ID = 200L;
    private static final Long TICKET_ID = 50L;
    private static final Long TASK_ID = 500L;

    private User adminUser;
    private User otherAdminUser;
    private User studentUser;
    private User mentorUser;
    private MentoringTask task;
    private MentoringDisputeTicket ticket;
    private MentoringPaymentLedger escrowLedger;

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
            public MentoringDisputeTicketResponse resolveTicket(Long adminUserId, Long ticketId, AdminResolveTicketRequest request) {
                MentoringDisputeTicket t = ticketRepository.findById(ticketId).orElse(null);
                if (t != null && t.getHandledBy() != null && !t.getHandledBy().getId().equals(adminUserId)) {
                    throw new ForbiddenException("not the handling admin");
                }
                return super.resolveTicket(adminUserId, ticketId, request);
            }
        };

        financeService = new MentoringFinanceServiceImpl(
                taskRepository,
                ledgerRepository,
                extensionRepository,
                amendmentRepository,
                ticketRepository,
                evidenceRepository,
                userRepository,
                disbursementService
        );

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
                .status(MentoringTaskStatus.IN_PROGRESS)
                .startedAt(Instant.now().minusSeconds(86400))
                .deadline(Instant.now().plusSeconds(86400))
                .build();

        ticket = MentoringDisputeTicket.builder()
                .id(TICKET_ID)
                .ticketCode("TCK-2026-001")
                .ticketType(MentoringTicketType.DISPUTE)
                .status(MentoringTicketStatus.IN_REVIEW)
                .task(task)
                .student(studentUser)
                .mentor(mentorUser)
                .createdBy(studentUser)
                .title("Tranh chấp hoàn thành task")
                .description("Mentor không hỗ trợ đầy đủ")
                .totalAmount(BigDecimal.valueOf(1000000))
                .handledBy(adminUser)
                .createdAt(Instant.now())
                .build();

        escrowLedger = MentoringPaymentLedger.builder()
                .id(300L)
                .task(task)
                .deal(deal)
                .student(studentUser)
                .mentor(mentorUser)
                .amount(BigDecimal.valueOf(1000000))
                .transactionType(MentoringLedgerTransactionType.ESCROW_COLLECTION)
                .status(MentoringLedgerStatus.SUCCEEDED)
                .createdAt(Instant.now().minusSeconds(86400))
                .build();
    }

    @Test
    @DisplayName("UTCID01 - Ticket IN_REVIEW; escrow 1,000,000 -> decision FULL_MENTOR_PAYMENT -> Ticket RESOLVED; task COMPLETED; PAYOUT ledger queued")
    void utcid01_resolveTicket_ok() {
        // Given
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.FULL_MENTOR_PAYMENT)
                .decisionReason("Mentor đã hoàn thành toàn bộ yêu cầu dự án")
                .disputeFee(BigDecimal.ZERO)
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));
        when(taskRepository.save(any(MentoringTask.class))).thenAnswer(i -> i.getArgument(0));

        when(ledgerRepository.save(any(MentoringPaymentLedger.class))).thenAnswer(i -> {
            MentoringPaymentLedger l = i.getArgument(0);
            l.setId(301L);
            return l;
        });
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenAnswer(i -> i.getArgument(0));
        when(messageRepository.save(any(MentoringTicketMessage.class))).thenAnswer(i -> {
            MentoringTicketMessage m = i.getArgument(0);
            m.setId(401L);
            return m;
        });

        // When
        MentoringDisputeTicketResponse response = ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(ticket.getStatus()).isEqualTo(MentoringTicketStatus.RESOLVED);
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.COMPLETED);
        verify(disbursementService).dispatchPayoutAfterCommit(301L);
        verify(mentorReputationService).recordTaskCompleted(mentorUser);
    }

    @Test
    @DisplayName("UTCID02 - Ticket DISPUTE IN_REVIEW -> decision FULL_STUDENT_REFUND -> Task CANCELLED; REFUND ledger queued; mentor penalty applied")
    void utcid02_resolveTicket_ok() {
        // Given
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.FULL_STUDENT_REFUND)
                .decisionReason("Mentor không thực hiện nhiệm vụ theo đúng thỏa thuận")
                .disputeFee(BigDecimal.ZERO)
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));
        when(taskRepository.save(any(MentoringTask.class))).thenAnswer(i -> i.getArgument(0));

        MentorProfile mentorProfile = MentorProfile.builder().id(88L).user(mentorUser).build();
        when(mentorProfileRepository.findByUserId(MENTOR_ID)).thenReturn(Optional.of(mentorProfile));

        when(ledgerRepository.save(any(MentoringPaymentLedger.class))).thenAnswer(i -> {
            MentoringPaymentLedger l = i.getArgument(0);
            l.setId(302L);
            return l;
        });
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenAnswer(i -> i.getArgument(0));
        when(messageRepository.save(any(MentoringTicketMessage.class))).thenAnswer(i -> {
            MentoringTicketMessage m = i.getArgument(0);
            m.setId(402L);
            return m;
        });

        // When
        MentoringDisputeTicketResponse response = ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.CANCELLED);
        verify(mentorReputationService).applyPenalty(eq(88L), anyString());
        verify(disbursementService).dispatchPayoutAfterCommit(302L);
    }

    @Test
    @DisplayName("UTCID03 - Ticket IN_REVIEW -> split mentor=500000, refund=400000, fee=100000 -> Task RESOLVED; PAYOUT and REFUND ledgers queued")
    void utcid03_resolveTicket_ok() {
        // Given
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.PARTIAL_SPLIT)
                .decisionReason("Hai bên cùng thỏa thuận phân chia theo khối lượng hoàn thành")
                .mentorAmount(BigDecimal.valueOf(500000))
                .studentRefund(BigDecimal.valueOf(400000))
                .disputeFee(BigDecimal.valueOf(100000))
                .splitMode("AMOUNT")
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));
        when(taskRepository.save(any(MentoringTask.class))).thenAnswer(i -> i.getArgument(0));

        when(ledgerRepository.save(any(MentoringPaymentLedger.class))).thenAnswer(i -> {
            MentoringPaymentLedger l = i.getArgument(0);
            l.setId(303L);
            return l;
        });
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenAnswer(i -> i.getArgument(0));
        when(messageRepository.save(any(MentoringTicketMessage.class))).thenAnswer(i -> {
            MentoringTicketMessage m = i.getArgument(0);
            m.setId(403L);
            return m;
        });

        // When
        MentoringDisputeTicketResponse response = ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.RESOLVED);
        assertThat(ticket.getStatus()).isEqualTo(MentoringTicketStatus.RESOLVED);
        verify(disbursementService, org.mockito.Mockito.times(2)).dispatchPayoutAfterCommit(anyLong());
    }

    @Test
    @DisplayName("UTCID04 - Ticket IN_REVIEW -> split amounts sum != escrow -> BadRequestException: total allocation must equal the escrow")
    void utcid04_resolveTicket_badRequest() {
        // Given
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.PARTIAL_SPLIT)
                .decisionReason("Tổng tiền phân chia không khớp")
                .mentorAmount(BigDecimal.valueOf(500000))
                .studentRefund(BigDecimal.valueOf(300000))
                .disputeFee(BigDecimal.valueOf(100000)) // Total 900,000 != 1,000,000
                .splitMode("AMOUNT")
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));

        // When / Then
        assertThatThrownBy(() -> ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("phải bằng đúng tổng quỹ Escrow");
    }

    @Test
    @DisplayName("UTCID05 - Ticket IN_REVIEW -> disputeFee = -1 -> BadRequestException: dispute fee must not be negative")
    void utcid05_resolveTicket_badRequest() {
        // Given
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.FULL_MENTOR_PAYMENT)
                .decisionReason("Phí xử lý âm")
                .disputeFee(BigDecimal.valueOf(-1))
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));

        // When / Then
        assertThatThrownBy(() -> ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phí xử lý tranh chấp không được âm");
    }

    @Test
    @DisplayName("UTCID06 - Ticket RESOLVED -> resolveTicket -> ConflictException: Ticket này đã được giải quyết phán quyết trước đó rồi.")
    void utcid06_resolveTicket_conflict() {
        // Given
        ticket.setStatus(MentoringTicketStatus.RESOLVED);
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.FULL_MENTOR_PAYMENT)
                .decisionReason("Cố gắng giải quyết lại vé đã xong")
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        // When / Then
        assertThatThrownBy(() -> ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Ticket này đã được giải quyết phán quyết trước đó rồi.");
    }

    @Test
    @DisplayName("UTCID07 - Ticket handled by another admin -> resolveTicket -> ForbiddenException: not the handling admin")
    void utcid07_resolveTicket_forbidden() {
        // Given
        ticket.setHandledBy(otherAdminUser);
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.FULL_MENTOR_PAYMENT)
                .decisionReason("Admin khác can thiệp")
                .build();

        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));

        // When / Then
        assertThatThrownBy(() -> ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("not the handling admin");
    }

    @Test
    @DisplayName("UTCID08 - Ticket resolved -> resolveTicket -> System message with the decision posted; both parties notified")
    void utcid08_resolveTicket_ok() {
        // Given
        AdminResolveTicketRequest request = AdminResolveTicketRequest.builder()
                .decision(MentoringTicketDecision.FULL_MENTOR_PAYMENT)
                .decisionReason("Đã thẩm tra đầy đủ và phán quyết chính thức")
                .disputeFee(BigDecimal.ZERO)
                .build();

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(ticket));
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));
        when(taskRepository.save(any(MentoringTask.class))).thenAnswer(i -> i.getArgument(0));

        when(ledgerRepository.save(any(MentoringPaymentLedger.class))).thenAnswer(i -> {
            MentoringPaymentLedger l = i.getArgument(0);
            l.setId(305L);
            return l;
        });
        when(ticketRepository.save(any(MentoringDisputeTicket.class))).thenAnswer(i -> i.getArgument(0));
        when(messageRepository.save(any(MentoringTicketMessage.class))).thenAnswer(i -> {
            MentoringTicketMessage m = i.getArgument(0);
            m.setId(405L);
            return m;
        });

        // When
        MentoringDisputeTicketResponse response = ticketService.resolveTicket(ADMIN_ID, TICKET_ID, request);

        // Then
        assertThat(response).isNotNull();
        verify(messageRepository).save(any(MentoringTicketMessage.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/mentoring/tickets/" + TICKET_ID + "/messages"), any(Object.class));
        verify(notificationService).sendMentoringTicketResolvedNotification(adminUser, studentUser, mentorUser, ticket);
    }

    @Test
    @DisplayName("UTCID09 - Tasks with ledger entries -> getTaskFunds -> Page of task fund summaries")
    void utcid09_getTaskFunds_ok() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<MentoringTask> taskPage = new PageImpl<>(List.of(task), pageable, 1);

        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(taskRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(taskPage);
        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger));

        // When
        PageResponse<AdminTaskFundSummaryResponse> response = financeService.getTaskFunds(
                ADMIN_ID, "Spring", null, null, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getTaskId()).isEqualTo(TASK_ID);
        assertThat(response.getContent().get(0).getTotalCollected()).isEqualByComparingTo(BigDecimal.valueOf(1000000));
    }

    @Test
    @DisplayName("UTCID10 - Task has escrow, payout and refund entries -> getTaskFundDetail -> Ledger entries and held escrow returned")
    void utcid10_getTaskFundDetail_ok() {
        // Given
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(adminUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        MentoringPaymentLedger payoutLedger = MentoringPaymentLedger.builder()
                .id(306L)
                .task(task)
                .transactionType(MentoringLedgerTransactionType.PAYOUT)
                .status(MentoringLedgerStatus.SUCCEEDED)
                .amount(BigDecimal.valueOf(600000))
                .createdAt(Instant.now())
                .build();

        when(ledgerRepository.findByTaskId(TASK_ID)).thenReturn(List.of(escrowLedger, payoutLedger));
        when(extensionRepository.findByTaskIdOrderByCreatedAtDesc(TASK_ID)).thenReturn(Collections.emptyList());
        when(amendmentRepository.findByTaskIdOrderByCreatedAtDesc(TASK_ID)).thenReturn(Collections.emptyList());
        when(ticketRepository.findByTaskIdOrderByCreatedAtDesc(TASK_ID)).thenReturn(Collections.emptyList());

        // When
        AdminTaskFundDetailResponse response = financeService.getTaskFundDetail(ADMIN_ID, TASK_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSummary()).isNotNull();
        assertThat(response.getSummary().getTotalCollected()).isEqualByComparingTo(BigDecimal.valueOf(1000000));
        assertThat(response.getLedgers()).hasSize(2);
    }

    @Test
    @DisplayName("UTCID11 - Caller is not an admin -> getTaskFunds -> ForbiddenException: admin only")
    void utcid11_getTaskFunds_forbidden() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(studentUser));

        // When / Then
        assertThatThrownBy(() -> financeService.getTaskFunds(STUDENT_ID, null, null, null, pageable))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Chỉ Quản trị viên mới có quyền tra cứu Sổ quỹ và Lịch sử tài chính Mentoring");
    }
}
