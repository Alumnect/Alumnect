package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupMemberRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestAttachmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestMemberRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserTermsAcceptanceRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringRequestDetailResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentorMatchingService;
import com.alumnect.alumnect_backend.service.mentorship.MentorReputationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestLifecycleService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-54 Mentoring - View Responses & Respond to Requests.
 * Report sheet : FE-54 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringRequestServiceImpl.getRequestDetailWithResponses(),
 *                MentoringRequestServiceImpl.getIncomingRequests(),
 *                MentoringRequestServiceImpl.getIncomingRequestDetail(),
 *                MentoringRequestServiceImpl.acceptIncomingRequest(),
 *                MentoringRequestServiceImpl.declineIncomingRequest()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-54 Mentoring - View Responses & Respond to Requests")
class FE54_MentorIncomingRequestTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private IndustryRepository industryRepository;

    @Mock
    private UserTermsAcceptanceRepository userTermsAcceptanceRepository;

    @Mock
    private MentoringRequestRepository mentoringRequestRepository;

    @Mock
    private MentoringRequestAttachmentRepository mentoringRequestAttachmentRepository;

    @Mock
    private MentoringRequestDistributionRepository mentoringRequestDistributionRepository;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private MentorSubscriptionRepository mentorSubscriptionRepository;

    @Mock
    private MentorSupportedFieldRepository mentorSupportedFieldRepository;

    @Mock
    private MentorMatchingService mentorMatchingService;

    @Mock
    private MentoringProperties mentoringProperties;

    @Mock
    private MentoringConversationService mentoringConversationService;

    @Mock
    private MentoringTaskRepository mentoringTaskRepository;

    @Mock
    private MentoringGroupService mentoringGroupService;

    @Mock
    private MentoringGroupRepository mentoringGroupRepository;

    @Mock
    private MentoringGroupMemberRepository mentoringGroupMemberRepository;

    @Mock
    private MentoringRequestMemberRepository mentoringRequestMemberRepository;

    @Mock
    private MentoringRules mentoringRules;

    @Mock
    private MentoringRequestLifecycleService requestLifecycleService;

    @Mock
    private MentorReputationService mentorReputationService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MentoringRequestServiceImpl mentoringRequestService;

    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String MENTOR_EMAIL = "mentor@fpt.edu.vn";
    private static final Long STUDENT_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long MENTOR_PROFILE_ID = 10L;
    private static final Long REQUEST_ID = 100L;

    private User studentUser;
    private User mentorUser;
    private MentorProfile mentorProfile;
    private MentoringRequest testRequest;
    private MentoringRequestDistribution distribution;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().id(3L).name("STUDENT").build();
        studentUser = User.builder().id(STUDENT_ID).email(STUDENT_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email(MENTOR_EMAIL).role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();

        mentorProfile = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .build();

        Industry industry = Industry.builder().id(5L).name("IT").build();

        testRequest = MentoringRequest.builder()
                .id(REQUEST_ID)
                .student(studentUser)
                .industry(industry)
                .title("Học Java")
                .status(MentoringRequestStatus.OPEN)
                .requestType(MentoringRequestType.GENERAL)
                .createdAt(Instant.now())
                .build();

        distribution = MentoringRequestDistribution.builder()
                .id(500L)
                .request(testRequest)
                .mentorProfile(mentorProfile)
                .status(MentoringDistributionStatus.PENDING)
                .distributedAt(Instant.now().minus(2, ChronoUnit.HOURS))
                .build();
    }

    private void mockActiveSubscription() {
        MentorSubscription sub = MentorSubscription.builder()
                .id(1L)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(MENTOR_PROFILE_ID))
                .thenReturn(List.of(sub));
    }

    // ================= getRequestDetailWithResponses() =================

    @Test
    @DisplayName("UTCID01 - Owner of a request with responses -> getRequestDetailWithResponses -> Request with accepted / declined / pending responses")
    void utcid01_getRequestDetailWithResponses_ok() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestAttachmentRepository.findByRequestId(REQUEST_ID)).thenReturn(Collections.emptyList());
        when(mentoringRequestDistributionRepository.findByRequestIdOrderByDistributedAtAsc(REQUEST_ID))
                .thenReturn(List.of(distribution));

        // When
        MentoringRequestDetailResponse response = mentoringRequestService.getRequestDetailWithResponses(STUDENT_EMAIL, REQUEST_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(REQUEST_ID);
        assertThat(response.getResponseSummary()).isNotNull();
        assertThat(response.getResponseSummary().getTotalDistributed()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID02 - Request of another student -> getRequestDetailWithResponses -> ForbiddenException")
    void utcid02_getRequestDetailWithResponses_forbiddenOtherStudent() {
        // Given
        User otherUser = User.builder().id(999L).email("other@fpt.edu.vn").build();
        when(userRepository.findByEmail("other@fpt.edu.vn")).thenReturn(Optional.of(otherUser));
        when(mentoringRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringGroupService.isActiveMember(testRequest, 999L)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.getRequestDetailWithResponses("other@fpt.edu.vn", REQUEST_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền xem yêu cầu cố vấn này");
    }

    // ================= getIncomingRequests() =================

    @Test
    @DisplayName("UTCID03 - Mentor ACTIVE with incoming requests -> getIncomingRequests -> Paged incoming requests")
    void utcid03_getIncomingRequests_ok() {
        // Given
        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentorSupportedFieldRepository.findByMentorProfileId(MENTOR_PROFILE_ID)).thenReturn(Collections.emptyList());

        Pageable pageable = PageRequest.of(0, 10);
        Page<MentoringRequest> pageResult = new PageImpl<>(List.of(testRequest), pageable, 1);
        when(mentoringRequestRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(pageResult);
        when(mentoringRequestDistributionRepository.findByRequestIdsAndMentorProfileId(any(), eq(MENTOR_PROFILE_ID)))
                .thenReturn(List.of(distribution));

        // When
        PageResponse<MentorIncomingRequestResponse> response = mentoringRequestService.getIncomingRequests(
                MENTOR_EMAIL, null, null, null, 0, 10);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(REQUEST_ID);
    }

    @Test
    @DisplayName("UTCID04 - Locked mentor account -> getIncomingRequests -> ForbiddenException")
    void utcid04_getIncomingRequests_forbiddenLocked() {
        // Given
        mentorUser.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.getIncomingRequests(MENTOR_EMAIL, null, null, null, 0, 10))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
    }

    // ================= getIncomingRequestDetail() =================

    @Test
    @DisplayName("UTCID05 - Request addressed to the mentor -> getIncomingRequestDetail -> Detail returned")
    void utcid05_getIncomingRequestDetail_ok() {
        // Given
        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentoringRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findByRequestIdAndMentorProfileId(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));
        mockActiveSubscription();

        // When
        MentorIncomingRequestDetailResponse response = mentoringRequestService.getIncomingRequestDetail(MENTOR_EMAIL, REQUEST_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(REQUEST_ID);
        assertThat(response.getResponseStatus()).isEqualTo("WAITING");
    }

    @Test
    @DisplayName("UTCID06 - Request addressed to another mentor -> getIncomingRequestDetail -> ForbiddenException")
    void utcid06_getIncomingRequestDetail_forbiddenOtherMentor() {
        // Given: Direct request to another mentor
        MentorProfile anotherMentor = MentorProfile.builder().id(888L).build();
        MentoringRequest directOther = MentoringRequest.builder()
                .id(200L)
                .student(studentUser)
                .requestType(MentoringRequestType.DIRECT)
                .targetMentor(anotherMentor)
                .status(MentoringRequestStatus.OPEN)
                .build();

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentoringRequestRepository.findById(200L)).thenReturn(Optional.of(directOther));
        when(mentoringRequestDistributionRepository.findByRequestIdAndMentorProfileId(200L, MENTOR_PROFILE_ID))
                .thenReturn(Optional.empty());
        mockActiveSubscription();

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.getIncomingRequestDetail(MENTOR_EMAIL, 200L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền truy cập yêu cầu này");
    }

    // ================= acceptIncomingRequest() =================

    @Test
    @DisplayName("UTCID07 - Request OPEN; mentor ACTIVE -> acceptIncomingRequest -> Response ACCEPTED and Chat for Task opened")
    void utcid07_acceptIncomingRequest_ok() {
        // Given
        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));
        when(mentoringGroupService.isActiveMember(testRequest, MENTOR_USER_ID)).thenReturn(false);

        Conversation conv = Conversation.builder().id(999L).build();
        when(mentoringConversationService.getOrCreateConversation(testRequest, mentorUser)).thenReturn(conv);
        when(mentoringRequestDistributionRepository.save(distribution)).thenReturn(distribution);

        RespondMentoringRequestRequest reqDto = new RespondMentoringRequestRequest();
        reqDto.setResponseNote("Tôi đồng ý hỗ trợ em");

        // When
        MentorIncomingRequestDetailResponse response = mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, reqDto);

        // Then
        assertThat(response).isNotNull();
        assertThat(distribution.getStatus()).isEqualTo(MentoringDistributionStatus.ACCEPTED);
        verify(mentoringConversationService).getOrCreateConversation(testRequest, mentorUser);
        verify(notificationService).sendMentoringRequestResponseNotification(mentorUser, studentUser, testRequest, true);
    }

    @Test
    @DisplayName("UTCID08 - Mentor already accepted -> acceptIncomingRequest -> Existing chat returned; no duplicate response")
    void utcid08_acceptIncomingRequest_okAlreadyAccepted() {
        // Given
        distribution.setStatus(MentoringDistributionStatus.ACCEPTED);

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));

        Conversation conv = Conversation.builder().id(999L).build();
        when(mentoringConversationService.getOrCreateConversation(testRequest, mentorUser)).thenReturn(conv);

        // When
        MentorIncomingRequestDetailResponse response = mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null);

        // Then
        assertThat(response).isNotNull();
        verify(mentoringRequestDistributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID09 - Request OPEN -> declineIncomingRequest(reason) -> Response DECLINED")
    void utcid09_declineIncomingRequest_ok() {
        // Given
        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));
        when(mentoringRequestDistributionRepository.save(distribution)).thenReturn(distribution);

        RespondMentoringRequestRequest reqDto = new RespondMentoringRequestRequest();
        reqDto.setResponseNote("Bận lịch công tác");

        // When
        MentorIncomingRequestDetailResponse response = mentoringRequestService.declineIncomingRequest(MENTOR_EMAIL, REQUEST_ID, reqDto);

        // Then
        assertThat(response).isNotNull();
        assertThat(distribution.getStatus()).isEqualTo(MentoringDistributionStatus.REJECTED);
        verify(mentoringRequestDistributionRepository).save(distribution);
    }

    @Test
    @DisplayName("UTCID10 - Mentor already declined -> acceptIncomingRequest -> ConflictException")
    void utcid10_acceptIncomingRequest_conflictAlreadyDeclined() {
        // Given
        distribution.setStatus(MentoringDistributionStatus.REJECTED);

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));
        when(mentoringGroupService.isActiveMember(testRequest, MENTOR_USER_ID)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã từ chối yêu cầu này trước đó, không thể phản hồi lại");
    }

    @Test
    @DisplayName("UTCID11 - Mentor already accepted -> declineIncomingRequest -> ConflictException")
    void utcid11_declineIncomingRequest_conflictAlreadyAccepted() {
        // Given
        distribution.setStatus(MentoringDistributionStatus.ACCEPTED);

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.declineIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã chấp nhận yêu cầu này trước đó, không thể thay đổi quyết định");
    }

    @Test
    @DisplayName("UTCID12 - Request is closed or matched -> acceptIncomingRequest -> BadRequestException")
    void utcid12_acceptIncomingRequest_badRequestNotOpen() {
        // Given
        testRequest.setStatus(MentoringRequestStatus.CLOSED);

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Yêu cầu cố vấn này đã đóng, đã chọn Mentor khác hoặc không còn tiếp nhận phản hồi mới");
    }

    @Test
    @DisplayName("UTCID13 - Expected deadline passed -> acceptIncomingRequest -> BadRequestException")
    void utcid13_acceptIncomingRequest_badRequestDeadlinePassed() {
        // Given
        testRequest.setExpectedDeadline(Instant.now().minus(1, ChronoUnit.DAYS));

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Yêu cầu đã quá thời hạn mong muốn của Học viên, không thể nhận thêm phản hồi.");
    }

    @Test
    @DisplayName("UTCID14 - Mentor not ACTIVE -> acceptIncomingRequest -> ForbiddenException")
    void utcid14_acceptIncomingRequest_forbiddenMentorNotActive() {
        // Given
        mentorProfile.setMentorStatus(MentorStatus.INCOMPLETE);

        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Hồ sơ Mentor của bạn không trong trạng thái hoạt động (ACTIVE) để phản hồi yêu cầu");
    }

    @Test
    @DisplayName("UTCID15 - Mentor is a member of the requesting group -> acceptIncomingRequest -> ForbiddenException")
    void utcid15_acceptIncomingRequest_forbiddenMentorInRequestGroup() {
        // Given
        when(userRepository.findByEmail(MENTOR_EMAIL)).thenReturn(Optional.of(mentorUser));
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        mockActiveSubscription();
        when(mentoringRequestRepository.findByIdForUpdate(REQUEST_ID)).thenReturn(Optional.of(testRequest));
        when(mentoringRequestDistributionRepository.findForUpdate(REQUEST_ID, MENTOR_PROFILE_ID))
                .thenReturn(Optional.of(distribution));
        when(mentoringGroupService.isActiveMember(testRequest, MENTOR_USER_ID)).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.acceptIncomingRequest(MENTOR_EMAIL, REQUEST_ID, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn là thành viên của nhóm gửi yêu cầu này nên không thể nhận làm Mentor.");
    }
}
