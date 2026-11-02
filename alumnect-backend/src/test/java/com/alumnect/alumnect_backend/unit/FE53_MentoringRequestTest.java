package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
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
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentoringAttachmentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroup;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.UserTermsAcceptance;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
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
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-53 Mentoring - Create Mentoring Request & Direct Request.
 * Report sheet : FE-53 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringRequestServiceImpl.createMentoringRequest(),
 *                MentoringRequestServiceImpl.getMyRequests(),
 *                MentoringRequestServiceImpl.getRequestDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-53 Mentoring - Create Mentoring Request & Direct Request")
class FE53_MentoringRequestTest {

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

    private static final String USER_EMAIL = "student@fpt.edu.vn";
    private static final Long STUDENT_ID = 1L;
    private static final Long INDUSTRY_ID = 10L;
    private static final Long MENTOR_PROFILE_ID = 100L;

    private User studentUser;
    private Industry industry;
    private CreateMentoringRequestRequest standardRequest;
    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();

        Role studentRole = Role.builder().id(3L).name("STUDENT").build();
        studentUser = User.builder()
                .id(STUDENT_ID)
                .email(USER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        industry = Industry.builder().id(INDUSTRY_ID).name("Công nghệ phần mềm").build();

        standardRequest = CreateMentoringRequestRequest.builder()
                .title("Cần hỗ trợ ôn luyện phỏng vấn Java Spring Boot")
                .description("Em là sinh viên năm cuối cần tìm Mentor hỗ trợ review CV và phỏng vấn thử mảng Backend.")
                .industryId(INDUSTRY_ID)
                .taskType(com.alumnect.alumnect_backend.common.enums.MentoringTaskType.RESUME_REVIEW)
                .participationType(MentoringType.INDIVIDUAL)
                .workingMode(MentoringWorkingMode.ONLINE)
                .budgetMin(BigDecimal.valueOf(200000))
                .budgetMax(BigDecimal.valueOf(500000))
                .expectedDeadline(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
    }

    // ================= createMentoringRequest() =================

    @Test
    @DisplayName("UTCID01 - ACTIVE user; terms accepted -> valid general request -> Request OPEN and distributed to matching mentors")
    void utcid01_createMentoringRequest_okGeneral() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));

        MentoringRequest savedRequest = MentoringRequest.builder()
                .id(50L)
                .student(studentUser)
                .title(standardRequest.getTitle())
                .status(MentoringRequestStatus.OPEN)
                .requestType(MentoringRequestType.GENERAL)
                .industry(industry)
                .createdAt(Instant.now())
                .build();
        when(mentoringRequestRepository.save(any(MentoringRequest.class))).thenReturn(savedRequest);
        when(mentorMatchingService.findMatchingMentors(eq(INDUSTRY_ID), eq(MentoringWorkingMode.ONLINE), eq(MentoringType.INDIVIDUAL), any()))
                .thenReturn(Collections.emptyList());
        when(mentorMatchingService.distributeRequestToMentors(eq(savedRequest), any())).thenReturn(0);

        // When
        CreateMentoringRequestResponse response = mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getStatus()).isEqualTo(MentoringRequestStatus.OPEN);
        assertThat(response.getRequestType()).isEqualTo(MentoringRequestType.GENERAL);
        verify(mentorMatchingService).findMatchingMentors(eq(INDUSTRY_ID), eq(MentoringWorkingMode.ONLINE), eq(MentoringType.INDIVIDUAL), any());
    }

    @Test
    @DisplayName("UTCID02 - ACTIVE user; mentor ACTIVE with valid plan -> valid direct request (mentorId) -> Request sent only to the selected mentor")
    void utcid02_createMentoringRequest_okDirect() {
        // Given
        standardRequest.setMentorId(MENTOR_PROFILE_ID);

        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        User mentorUser = User.builder().id(20L).email("mentor@fpt.edu.vn").role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        MentorProfile mentorProfile = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .mentoringType(MentoringType.INDIVIDUAL)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));

        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(MENTOR_PROFILE_ID))
                .thenReturn(List.of(MentorSubscription.builder()
                        .status(MentorSubscriptionStatus.ACTIVE)
                        .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                        .build()));
        when(mentorSupportedFieldRepository.existsByMentorProfileIdAndIndustryId(MENTOR_PROFILE_ID, INDUSTRY_ID))
                .thenReturn(true);

        MentoringRequest savedRequest = MentoringRequest.builder()
                .id(51L)
                .student(studentUser)
                .targetMentor(mentorProfile)
                .status(MentoringRequestStatus.OPEN)
                .requestType(MentoringRequestType.DIRECT)
                .industry(industry)
                .createdAt(Instant.now())
                .build();
        when(mentoringRequestRepository.save(any(MentoringRequest.class))).thenReturn(savedRequest);

        // When
        CreateMentoringRequestResponse response = mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(51L);
        assertThat(response.getRequestType()).isEqualTo(MentoringRequestType.DIRECT);
        verify(mentorMatchingService, never()).findMatchingMentors(any(), any(), any(), any());
        verify(mentoringRequestDistributionRepository).save(any());
    }

    @Test
    @DisplayName("UTCID03 - ACTIVE user -> title with 5 / 200 characters -> Request created")
    void utcid03_createMentoringRequest_okBoundaryTitle() {
        // Given
        standardRequest.setTitle("12345"); // 5 chars
        Set<ConstraintViolation<CreateMentoringRequestRequest>> violationsMin = validator.validate(standardRequest);
        assertThat(violationsMin).isEmpty();

        standardRequest.setTitle("A".repeat(200)); // 200 chars
        Set<ConstraintViolation<CreateMentoringRequestRequest>> violationsMax = validator.validate(standardRequest);
        assertThat(violationsMax).isEmpty();
    }

    @Test
    @DisplayName("UTCID04 - ACTIVE user -> title with 4 / 201 characters -> Validation error")
    void utcid04_createMentoringRequest_invalidTitle() {
        // Given (4 chars)
        standardRequest.setTitle("1234");
        Set<ConstraintViolation<CreateMentoringRequestRequest>> violationsMin = validator.validate(standardRequest);
        assertThat(violationsMin).extracting(ConstraintViolation::getMessage)
                .contains("Tiêu đề yêu cầu phải từ 5 đến 200 ký tự");

        // Given (201 chars)
        standardRequest.setTitle("A".repeat(201));
        Set<ConstraintViolation<CreateMentoringRequestRequest>> violationsMax = validator.validate(standardRequest);
        assertThat(violationsMax).extracting(ConstraintViolation::getMessage)
                .contains("Tiêu đề yêu cầu phải từ 5 đến 200 ký tự");
    }

    @Test
    @DisplayName("UTCID05 - ACTIVE user -> description with 19 / 3001 characters -> Validation error")
    void utcid05_createMentoringRequest_invalidDescription() {
        // Given (19 chars)
        standardRequest.setDescription("A".repeat(19));
        Set<ConstraintViolation<CreateMentoringRequestRequest>> violationsMin = validator.validate(standardRequest);
        assertThat(violationsMin).extracting(ConstraintViolation::getMessage)
                .contains("Mô tả chi tiết phải từ 20 đến 3000 ký tự");

        // Given (3001 chars)
        standardRequest.setDescription("A".repeat(3001));
        Set<ConstraintViolation<CreateMentoringRequestRequest>> violationsMax = validator.validate(standardRequest);
        assertThat(violationsMax).extracting(ConstraintViolation::getMessage)
                .contains("Mô tả chi tiết phải từ 20 đến 3000 ký tự");
    }

    @Test
    @DisplayName("UTCID06 - ACTIVE user -> budgetMin=500000, budgetMax=300000 -> BadRequestException")
    void utcid06_createMentoringRequest_badRequestBudget() {
        // Given
        standardRequest.setBudgetMin(BigDecimal.valueOf(500000));
        standardRequest.setBudgetMax(BigDecimal.valueOf(300000));

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngân sách tối đa không được nhỏ hơn ngân sách tối thiểu");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - ACTIVE user -> expectedDeadline in the past -> BadRequestException")
    void utcid07_createMentoringRequest_badRequestDeadlinePast() {
        // Given
        standardRequest.setExpectedDeadline(Instant.now().minus(1, ChronoUnit.DAYS));

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời hạn mong muốn phải ở trong tương lai");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - ACTIVE user -> 6 attachments / attachment >= 10 MB -> BadRequestException")
    void utcid08_createMentoringRequest_badRequestAttachments() {
        // Given: 6 attachments
        List<MentoringAttachmentRequest> sixFiles = List.of(
                MentoringAttachmentRequest.builder().fileName("f1.pdf").fileSize(1024L).build(),
                MentoringAttachmentRequest.builder().fileName("f2.pdf").fileSize(1024L).build(),
                MentoringAttachmentRequest.builder().fileName("f3.pdf").fileSize(1024L).build(),
                MentoringAttachmentRequest.builder().fileName("f4.pdf").fileSize(1024L).build(),
                MentoringAttachmentRequest.builder().fileName("f5.pdf").fileSize(1024L).build(),
                MentoringAttachmentRequest.builder().fileName("f6.pdf").fileSize(1024L).build()
        );
        standardRequest.setAttachments(sixFiles);

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ được đính kèm tối đa 5 tệp tin");

        // Given: attachment >= 10 MB
        List<MentoringAttachmentRequest> bigFile = List.of(
                MentoringAttachmentRequest.builder().fileName("big.pdf").fileSize(10L * 1024L * 1024L).build()
        );
        standardRequest.setAttachments(bigFile);

        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Kích thước tệp tin 'big.pdf' phải nhỏ hơn 10 MB");
    }

    @Test
    @DisplayName("UTCID09 - Terms not accepted -> valid request -> BadRequestException")
    void utcid09_createMentoringRequest_badRequestTermsNotAccepted() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn cần đọc và chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi tạo yêu cầu");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - User is locked -> valid request -> ForbiddenException")
    void utcid10_createMentoringRequest_forbiddenUserLocked() {
        // Given
        studentUser.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Mentor is the requester -> direct request to self -> BadRequestException")
    void utcid11_createMentoringRequest_badRequestSelfDirect() {
        // Given
        standardRequest.setMentorId(MENTOR_PROFILE_ID);
        MentorProfile selfMentor = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(studentUser) // Self
                .mentorStatus(MentorStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));
        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(selfMentor));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn không thể tự gửi yêu cầu cố vấn cho chính bản thân mình");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID12 - Mentor not ACTIVE -> direct request -> BadRequestException")
    void utcid12_createMentoringRequest_badRequestMentorNotActive() {
        // Given
        standardRequest.setMentorId(MENTOR_PROFILE_ID);
        User mentorUser = User.builder().id(99L).accountStatus(AccountStatus.ACTIVE).build();
        MentorProfile inactiveMentor = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .mentorStatus(MentorStatus.INCOMPLETE)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));
        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(inactiveMentor));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mentor hiện không trong trạng thái hoạt động để tiếp nhận yêu cầu cố vấn mới");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - Mentor plan expired -> direct request -> BadRequestException")
    void utcid13_createMentoringRequest_badRequestMentorPlanExpired() {
        // Given
        standardRequest.setMentorId(MENTOR_PROFILE_ID);
        User mentorUser = User.builder().id(99L).accountStatus(AccountStatus.ACTIVE).build();
        MentorProfile mentorProfile = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));
        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(MENTOR_PROFILE_ID))
                .thenReturn(Collections.emptyList()); // no active subscription

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Gói hoạt động của Mentor đã hết hạn hoặc chưa được kích hoạt, tạm thời không thể tiếp nhận yêu cầu mới");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID14 - Mentor does not support the field -> direct request -> BadRequestException")
    void utcid14_createMentoringRequest_badRequestFieldNotSupported() {
        // Given
        standardRequest.setMentorId(MENTOR_PROFILE_ID);
        User mentorUser = User.builder().id(99L).accountStatus(AccountStatus.ACTIVE).build();
        MentorProfile mentorProfile = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));
        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(MENTOR_PROFILE_ID))
                .thenReturn(List.of(MentorSubscription.builder()
                        .status(MentorSubscriptionStatus.ACTIVE)
                        .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                        .build()));
        when(mentorSupportedFieldRepository.existsByMentorProfileIdAndIndustryId(MENTOR_PROFILE_ID, INDUSTRY_ID))
                .thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Lĩnh vực chuyên môn được chọn không nằm trong danh mục hỗ trợ của Mentor này. Vui lòng chọn lĩnh vực khác hoặc chọn Mentor phù hợp.");
        verify(mentoringRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID15 - Requester is not the group leader -> group request -> ForbiddenException")
    void utcid15_createMentoringRequest_forbiddenNotGroupLeader() {
        // Given
        standardRequest.setParticipationType(MentoringType.GROUP);
        standardRequest.setGroupId(500L);

        User otherLeader = User.builder().id(888L).build();
        MentoringGroup group = MentoringGroup.builder()
                .id(500L)
                .leader(otherLeader)
                .status(MentoringGroupStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(STUDENT_ID, "1.0"))
                .thenReturn(Optional.of(UserTermsAcceptance.builder().build()));
        when(industryRepository.findById(INDUSTRY_ID)).thenReturn(Optional.of(industry));
        when(mentoringGroupRepository.findById(500L)).thenReturn(Optional.of(group));

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.createMentoringRequest(USER_EMAIL, standardRequest))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ trưởng nhóm mới có quyền tạo yêu cầu Mentoring cho nhóm");
        verify(mentoringRequestRepository, never()).save(any());
    }

    // ================= getMyRequests() =================

    @Test
    @DisplayName("UTCID16 - User has requests -> getMyRequests(userId, page 0) -> Page of own requests")
    void utcid16_getMyRequests_ok() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        Pageable pageable = PageRequest.of(0, 10);
        MentoringRequest req = MentoringRequest.builder()
                .id(50L)
                .student(studentUser)
                .title("Request 1")
                .status(MentoringRequestStatus.OPEN)
                .industry(industry)
                .createdAt(Instant.now())
                .build();
        Page<MentoringRequest> page = new PageImpl<>(List.of(req), pageable, 1);
        when(mentoringRequestRepository.findByStudentIdOrderByCreatedAtDesc(STUDENT_ID, pageable))
                .thenReturn(page);
        when(mentoringRequestDistributionRepository.findByRequestIdIn(List.of(50L)))
                .thenReturn(Collections.emptyList());

        // When
        PageResponse<CreateMentoringRequestResponse> response = mentoringRequestService.getMyRequests(USER_EMAIL, 0, 10);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(50L);
    }

    // ================= getRequestDetail() =================

    @Test
    @DisplayName("UTCID17 - Request belongs to another user -> getRequestDetail(id, userId) -> ForbiddenException")
    void utcid17_getRequestDetail_forbiddenOtherUser() {
        // Given
        User otherUser = User.builder().id(999L).build();
        MentoringRequest otherRequest = MentoringRequest.builder()
                .id(60L)
                .student(otherUser)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));
        when(mentoringRequestRepository.findById(60L)).thenReturn(Optional.of(otherRequest));
        when(mentoringGroupService.isActiveMember(otherRequest, STUDENT_ID)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> mentoringRequestService.getRequestDetail(USER_EMAIL, 60L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền xem yêu cầu cố vấn này");
    }
}
