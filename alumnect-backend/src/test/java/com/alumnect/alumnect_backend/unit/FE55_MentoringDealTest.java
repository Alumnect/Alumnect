package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.enums.ProposalSource;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealSnapshotRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateDealRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringDealMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDealServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-55 Mentoring - Negotiate & Confirm a Mentoring Deal.
 * Report sheet : FE-55 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringDealServiceImpl.proposeDeal(),
 *                MentoringDealServiceImpl.updateDealTerms(),
 *                MentoringDealServiceImpl.confirmDeal(),
 *                MentoringDealServiceImpl.rejectDeal(),
 *                MentoringDealServiceImpl.cancelDeal(),
 *                MentoringDealServiceImpl.getDealDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-55 Mentoring - Negotiate & Confirm a Mentoring Deal")
class FE55_MentoringDealTest {

    @Mock
    private MentoringDealRepository dealRepository;

    @Mock
    private MentoringDealSnapshotRepository snapshotRepository;

    @Mock
    private MentoringRequestRepository requestRepository;

    @Mock
    private MentoringRequestDistributionRepository distributionRepository;

    @Mock
    private MentoringTaskRepository taskRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MentoringConversationService conversationService;

    @Mock
    private MentoringDealMapper dealMapper;

    @Mock
    private MentoringRules mentoringRules;

    @InjectMocks
    private MentoringDealServiceImpl mentoringDealService;

    private static final Long STUDENT_USER_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long CONVERSATION_ID = 10L;
    private static final Long REQUEST_ID = 100L;
    private static final Long DEAL_ID = 500L;

    private User studentUser;
    private User mentorUser;
    private Conversation conversation;
    private MentoringRequest mentoringRequest;
    private MentoringRequestDistribution distribution;
    private MentoringDeal deal;

    @BeforeEach
    void setUp() {
        studentUser = User.builder().id(STUDENT_USER_ID).email("student@fpt.edu.vn").build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email("mentor@fpt.edu.vn").build();

        mentoringRequest = MentoringRequest.builder()
                .id(REQUEST_ID)
                .student(studentUser)
                .status(MentoringRequestStatus.OPEN)
                .title("Học Spring Boot")
                .description("Cần hỗ trợ 1-1")
                .build();

        conversation = Conversation.builder()
                .id(CONVERSATION_ID)
                .mentoringMentor(mentorUser)
                .mentoringRequest(mentoringRequest)
                .build();

        distribution = MentoringRequestDistribution.builder()
                .id(80L)
                .request(mentoringRequest)
                .status(MentoringDistributionStatus.ACCEPTED)
                .build();

        deal = MentoringDeal.builder()
                .id(DEAL_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .request(mentoringRequest)
                .conversation(conversation)
                .version(1)
                .status(MentoringDealStatus.MENTOR_CONFIRMED)
                .isLocked(false)
                .build();
    }

    // ================= proposeDeal() =================

    @Test
    @DisplayName("UTCID01 - Mentor accepted the request -> proposeDeal(valid request) -> Deal version 1 created")
    void utcid01_proposeDeal_okV1() {
        // Given
        ProposeDealRequest req = ProposeDealRequest.builder()
                .conversationId(CONVERSATION_ID)
                .proposalSource(ProposalSource.RENEGOTIATION)
                .taskScope("Review code và mock interview 2 buổi")
                .agreedPrice(BigDecimal.valueOf(300000))
                .deadline(Instant.now().plus(7, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.MOCK_INTERVIEW)
                .expectedResult("Hoàn thành mock interview")
                .build();

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(conversationService.requireParticipantConversation(MENTOR_USER_ID, CONVERSATION_ID)).thenReturn(conversation);
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(distributionRepository.findByRequestIdAndMentorUserId(REQUEST_ID, MENTOR_USER_ID)).thenReturn(Optional.of(distribution));
        when(dealRepository.findByConversationId(CONVERSATION_ID)).thenReturn(Optional.empty());

        when(dealRepository.save(any(MentoringDeal.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dealMapper.toResponse(any(MentoringDeal.class))).thenReturn(new MentoringDealResponse());

        // When
        MentoringDealResponse response = mentoringDealService.proposeDeal(MENTOR_USER_ID, req);

        // Then
        assertThat(response).isNotNull();
        verify(dealRepository).save(any(MentoringDeal.class));
        verify(snapshotRepository).save(any());
    }

    @Test
    @DisplayName("UTCID02 - Deal not locked -> updateDealTerms(dealId, new price) -> New version created; previous version superseded")
    void utcid02_updateDealTerms_okNewVersion() {
        // Given
        UpdateDealRequest req = UpdateDealRequest.builder()
                .taskScope("Review code và mock interview 3 buổi")
                .agreedPrice(BigDecimal.valueOf(450000))
                .deadline(Instant.now().plus(10, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.MOCK_INTERVIEW)
                .expectedResult("Hoàn thành mock interview 3 buổi")
                .build();

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(distributionRepository.findByRequestIdAndMentorUserId(REQUEST_ID, MENTOR_USER_ID)).thenReturn(Optional.of(distribution));

        when(dealRepository.save(any(MentoringDeal.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dealMapper.toResponse(any(MentoringDeal.class))).thenReturn(new MentoringDealResponse());

        // When
        MentoringDealResponse response = mentoringDealService.updateDealTerms(MENTOR_USER_ID, DEAL_ID, req);

        // Then
        assertThat(response).isNotNull();
        assertThat(deal.getVersion()).isEqualTo(2);
        verify(dealRepository).save(deal);
        verify(snapshotRepository).save(any());
    }

    @Test
    @DisplayName("UTCID03 - Mentor accepted the request -> price = 0 -> Deal created with price 0")
    void utcid03_proposeDeal_okBoundaryZeroPrice() {
        // Given
        ProposeDealRequest req = ProposeDealRequest.builder()
                .conversationId(CONVERSATION_ID)
                .proposalSource(ProposalSource.RENEGOTIATION)
                .taskScope("Cố vấn miễn phí cho sinh viên")
                .agreedPrice(BigDecimal.ZERO)
                .deadline(Instant.now().plus(5, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.CONSULTATION)
                .expectedResult("Tư vấn xong")
                .build();

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(conversationService.requireParticipantConversation(MENTOR_USER_ID, CONVERSATION_ID)).thenReturn(conversation);
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(distributionRepository.findByRequestIdAndMentorUserId(REQUEST_ID, MENTOR_USER_ID)).thenReturn(Optional.of(distribution));
        when(dealRepository.findByConversationId(CONVERSATION_ID)).thenReturn(Optional.empty());

        when(dealRepository.save(any(MentoringDeal.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dealMapper.toResponse(any(MentoringDeal.class))).thenReturn(new MentoringDealResponse());

        // When
        MentoringDealResponse response = mentoringDealService.proposeDeal(MENTOR_USER_ID, req);

        // Then
        assertThat(response).isNotNull();
        verify(dealRepository).save(any());
    }

    @Test
    @DisplayName("UTCID04 - Mentor accepted the request -> deadline in the past -> BadRequestException")
    void utcid04_proposeDeal_badRequestDeadlinePast() {
        // Given
        ProposeDealRequest req = ProposeDealRequest.builder()
                .conversationId(CONVERSATION_ID)
                .proposalSource(ProposalSource.RENEGOTIATION)
                .taskScope("Nhiệm vụ")
                .agreedPrice(BigDecimal.valueOf(100000))
                .deadline(Instant.now().minus(1, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.CONSULTATION)
                .expectedResult("Xong")
                .build();

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(conversationService.requireParticipantConversation(MENTOR_USER_ID, CONVERSATION_ID)).thenReturn(conversation);
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.proposeDeal(MENTOR_USER_ID, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.");
        verify(dealRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Mentor accepted the request -> taskScope blank -> BadRequestException")
    void utcid05_proposeDeal_invalidTaskScope() {
        // Given
        ProposeDealRequest req = ProposeDealRequest.builder()
                .conversationId(CONVERSATION_ID)
                .proposalSource(ProposalSource.RENEGOTIATION)
                .taskScope("") // Blank
                .agreedPrice(BigDecimal.valueOf(100000))
                .deadline(Instant.now().plus(5, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.CONSULTATION)
                .expectedResult("Xong")
                .build();

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(conversationService.requireParticipantConversation(MENTOR_USER_ID, CONVERSATION_ID)).thenReturn(conversation);
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.proposeDeal(MENTOR_USER_ID, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phạm vi công việc (Task Scope) không được để trống.");
        verify(dealRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - Caller is the student -> proposeDeal -> ForbiddenException")
    void utcid06_proposeDeal_forbiddenStudent() {
        // Given
        ProposeDealRequest req = ProposeDealRequest.builder().conversationId(CONVERSATION_ID).build();
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(conversationService.requireParticipantConversation(STUDENT_USER_ID, CONVERSATION_ID)).thenReturn(conversation);

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.proposeDeal(STUDENT_USER_ID, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ Mentor trong cuộc trò chuyện mới được gửi thỏa thuận. Học viên có thể xác nhận, yêu cầu điều chỉnh hoặc từ chối.");
        verify(dealRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Mentor has not accepted the request -> proposeDeal -> ForbiddenException")
    void utcid07_proposeDeal_forbiddenMentorNotAccepted() {
        // Given
        ProposeDealRequest req = ProposeDealRequest.builder()
                .conversationId(CONVERSATION_ID)
                .proposalSource(ProposalSource.RENEGOTIATION)
                .taskScope("Scope")
                .agreedPrice(BigDecimal.valueOf(100000))
                .deadline(Instant.now().plus(5, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.CONSULTATION)
                .expectedResult("Xong")
                .build();

        distribution.setStatus(MentoringDistributionStatus.PENDING); // Not accepted
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(conversationService.requireParticipantConversation(MENTOR_USER_ID, CONVERSATION_ID)).thenReturn(conversation);
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(distributionRepository.findByRequestIdAndMentorUserId(REQUEST_ID, MENTOR_USER_ID)).thenReturn(Optional.of(distribution));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.proposeDeal(MENTOR_USER_ID, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn cần chấp nhận (ACCEPT) Request trước khi gửi Deal Ticket.");
        verify(dealRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - Deal is DEAL_CONFIRMED -> updateDealTerms -> ConflictException")
    void utcid08_updateDealTerms_conflictDealLocked() {
        // Given
        deal.setStatus(MentoringDealStatus.DEAL_CONFIRMED);
        deal.setIsLocked(true);

        UpdateDealRequest req = UpdateDealRequest.builder()
                .taskScope("Scope mới")
                .agreedPrice(BigDecimal.valueOf(200000))
                .deadline(Instant.now().plus(5, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.CONSULTATION)
                .expectedResult("Xong")
                .build();

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(distributionRepository.findByRequestIdAndMentorUserId(REQUEST_ID, MENTOR_USER_ID)).thenReturn(Optional.of(distribution));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.updateDealTerms(MENTOR_USER_ID, DEAL_ID, req))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Deal Ticket đã được hai bên xác nhận và khóa, không thể tạo phiên bản mới.");
    }

    // ================= confirmDeal() =================

    @Test
    @DisplayName("UTCID09 - Student confirms latest version -> confirmDeal -> Student confirmation recorded")
    void utcid09_confirmDeal_okStudentConfirmed() {
        // Given
        deal.setMentorConfirmed(false); // Mentor not confirmed yet

        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(dealRepository.save(deal)).thenReturn(deal);
        when(dealMapper.toResponse(deal)).thenReturn(new MentoringDealResponse());

        // When
        MentoringDealResponse response = mentoringDealService.confirmDeal(STUDENT_USER_ID, DEAL_ID, 1);

        // Then
        assertThat(response).isNotNull();
        assertThat(deal.getStudentConfirmed()).isTrue();
        assertThat(deal.getStatus()).isEqualTo(MentoringDealStatus.STUDENT_CONFIRMED);
    }

    @Test
    @DisplayName("UTCID10 - Student already confirmed; mentor confirms -> confirmDeal -> Deal becomes DEAL_CONFIRMED and snapshot locked")
    void utcid10_confirmDeal_okBothConfirmed() {
        // Given
        deal.setStudentConfirmed(true);
        deal.setMentorConfirmed(false);

        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(dealRepository.saveAndFlush(deal)).thenReturn(deal);
        when(dealMapper.toResponse(deal)).thenReturn(new MentoringDealResponse());

        // When
        MentoringDealResponse response = mentoringDealService.confirmDeal(MENTOR_USER_ID, DEAL_ID, 1);

        // Then
        assertThat(response).isNotNull();
        assertThat(deal.getStatus()).isEqualTo(MentoringDealStatus.DEAL_CONFIRMED);
        assertThat(deal.getIsLocked()).isTrue();
    }

    @Test
    @DisplayName("UTCID11 - Newer version exists -> confirmDeal(oldVersion) -> ConflictException")
    void utcid11_confirmDeal_conflictVersionMismatch() {
        // Given: deal is currently version 2, client confirms version 1
        deal.setVersion(2);

        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.confirmDeal(STUDENT_USER_ID, DEAL_ID, 1))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("đã bị thay thế bởi phiên bản");
    }

    @Test
    @DisplayName("UTCID12 - version is null -> confirmDeal(dealId, null) -> BadRequestException")
    void utcid12_confirmDeal_badRequestVersionNull() {
        // When + Then
        assertThatThrownBy(() -> mentoringDealService.confirmDeal(STUDENT_USER_ID, DEAL_ID, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiên bản Deal Ticket cần xác nhận (version) không được để trống.");
    }

    @Test
    @DisplayName("UTCID13 - User already confirmed the version -> confirmDeal -> BadRequestException")
    void utcid13_confirmDeal_badRequestAlreadyConfirmed() {
        // Given: Student already confirmed
        deal.setStudentConfirmed(true);

        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.confirmDeal(STUDENT_USER_ID, DEAL_ID, 1))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn đã xác nhận phiên bản thỏa thuận này rồi.");
    }

    // ================= rejectDeal() =================

    @Test
    @DisplayName("UTCID14 - Caller is the student -> rejectDeal -> Deal rejected")
    void utcid14_rejectDeal_ok() {
        // Given
        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(dealRepository.save(deal)).thenReturn(deal);
        when(dealMapper.toResponse(deal)).thenReturn(new MentoringDealResponse());

        // When
        MentoringDealResponse response = mentoringDealService.rejectDeal(STUDENT_USER_ID, DEAL_ID, "Không đồng ý giá", 1);

        // Then
        assertThat(response).isNotNull();
        assertThat(deal.getStatus()).isEqualTo(MentoringDealStatus.REJECTED);
    }

    @Test
    @DisplayName("UTCID15 - Caller is the mentor -> rejectDeal -> ForbiddenException")
    void utcid15_rejectDeal_forbiddenMentor() {
        // Given
        when(userRepository.findById(MENTOR_USER_ID)).thenReturn(Optional.of(mentorUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.rejectDeal(MENTOR_USER_ID, DEAL_ID, "Lý do", 1))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ Học viên mới có quyền từ chối Deal Ticket. Mentor có thể gửi phiên bản mới.");
    }

    // ================= cancelDeal() =================

    @Test
    @DisplayName("UTCID16 - Deal is locked -> cancelDeal -> ConflictException")
    void utcid16_cancelDeal_conflictLocked() {
        // Given
        deal.setIsLocked(true);
        deal.setStatus(MentoringDealStatus.DEAL_CONFIRMED);

        when(userRepository.findById(STUDENT_USER_ID)).thenReturn(Optional.of(studentUser));
        when(dealRepository.findRequestIdByDealId(DEAL_ID)).thenReturn(Optional.of(REQUEST_ID));
        when(requestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(mentoringRequest));
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.cancelDeal(STUDENT_USER_ID, DEAL_ID, "Muốn hủy"))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Không thể hủy thỏa thuận đã được cả hai bên xác nhận và khóa snapshot.");
    }

    // ================= getDealDetail() =================

    @Test
    @DisplayName("UTCID17 - Caller is not a participant -> getDealDetail -> ForbiddenException")
    void utcid17_getDealDetail_forbiddenNotParticipant() {
        // Given
        when(dealRepository.findDetailById(DEAL_ID)).thenReturn(Optional.of(deal));
        when(userRepository.findById(999L)).thenReturn(Optional.of(User.builder().id(999L).build()));
        when(participantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, 999L)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> mentoringDealService.getDealDetail(999L, DEAL_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền xem thỏa thuận Deal này.");
    }
}
