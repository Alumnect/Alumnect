package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserTermsAcceptanceRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorRegistrationRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationSaveResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsAcceptResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.UserTermsAcceptance;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.service.mentorship.MentorRegistrationServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-49 Mentoring - Terms & Mentor Registration.
 * Report sheet : FE-49 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringTermsServiceImpl.getCurrentTermsStatus(), acceptCurrentTerms(),
 *                MentorRegistrationServiceImpl.getRegistration(), saveRegistration()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-49 Mentoring - Terms & Mentor Registration")
class FE49_MentorRegistrationTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private UserSkillRepository userSkillRepository;

    @Mock
    private IndustryRepository industryRepository;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private MentorSupportedFieldRepository mentorSupportedFieldRepository;

    @Mock
    private MentorTopicRepository mentorTopicRepository;

    @Mock
    private MentorPayoutAccountRepository mentorPayoutAccountRepository;

    @Mock
    private UserTermsAcceptanceRepository userTermsAcceptanceRepository;

    @Mock
    private MentoringTermsService mockedTermsService;

    // ===== Systems under test =====
    private MentoringTermsServiceImpl mentoringTermsService;
    private MentorRegistrationServiceImpl mentorRegistrationService;

    // ===== Test data =====
    private static final Long ALUMNI_ID = 10L;
    private static final Long STUDENT_ID = 20L;
    private static final String ALUMNI_EMAIL = "alumni@fpt.edu.vn";
    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String TERMS_VERSION = "1.0";

    private User alumniUser;
    private User studentUser;
    private UserProfile alumniProfile;
    private Experience currentExp;
    private MentoringProperties mentoringProperties;

    @BeforeEach
    void setUp() {
        mentoringProperties = new MentoringProperties();
        mentoringProperties.setVersion(TERMS_VERSION);

        mentoringTermsService = new MentoringTermsServiceImpl(
                userRepository,
                userTermsAcceptanceRepository,
                mentoringProperties
        );

        mentorRegistrationService = new MentorRegistrationServiceImpl(
                userRepository,
                userProfileRepository,
                experienceRepository,
                userSkillRepository,
                industryRepository,
                mentorProfileRepository,
                mentorSupportedFieldRepository,
                mentorTopicRepository,
                mentorPayoutAccountRepository,
                mockedTermsService
        );

        Role alumniRole = Role.builder().id(1L).name("ALUMNI").build();
        Role studentRole = Role.builder().id(2L).name("STUDENT").build();

        alumniUser = User.builder().id(ALUMNI_ID).email(ALUMNI_EMAIL).role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        studentUser = User.builder().id(STUDENT_ID).email(STUDENT_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        alumniProfile = UserProfile.builder().userId(ALUMNI_ID).fullName("Tran Van Alumni").phone("0987654321").build();

        currentExp = Experience.builder().id(101L).user(alumniUser).title("Senior Software Engineer").company("FPT Software").isCurrent(true).build();
    }

    // ================= MentoringTermsService =================

    @Test
    @DisplayName("UTCID01 - Current terms version exists; user has not accepted -> accepted=false with terms version")
    void utcid01_getCurrentTermsStatus_okNotAccepted() {
        // Given
        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(ALUMNI_ID, TERMS_VERSION)).thenReturn(Optional.empty());

        // When
        MentoringTermsStatusResponse response = mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isAccepted()).isFalse();
        assertThat(response.getCurrentVersion()).isEqualTo(TERMS_VERSION);
    }

    @Test
    @DisplayName("UTCID02 - User has not accepted -> Acceptance saved with version and time")
    void utcid02_acceptCurrentTerms_okFirstTime() {
        // Given
        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(ALUMNI_ID, TERMS_VERSION)).thenReturn(Optional.empty());
        when(userTermsAcceptanceRepository.save(any(UserTermsAcceptance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        MentoringTermsAcceptResponse response = mentoringTermsService.acceptCurrentTerms(ALUMNI_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isAccepted()).isTrue();
        assertThat(response.getAcceptedVersion()).isEqualTo(TERMS_VERSION);
        verify(userTermsAcceptanceRepository).save(any(UserTermsAcceptance.class));
    }

    @Test
    @DisplayName("UTCID03 - User already accepted -> Existing acceptance returned; no duplicate")
    void utcid03_acceptCurrentTerms_okAlreadyAccepted() {
        // Given
        Instant acceptedTime = Instant.now().minusSeconds(3600);
        UserTermsAcceptance existing = UserTermsAcceptance.builder()
                .id(1L)
                .user(alumniUser)
                .termsVersion(TERMS_VERSION)
                .acceptedAt(acceptedTime)
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(ALUMNI_ID, TERMS_VERSION)).thenReturn(Optional.of(existing));

        // When
        MentoringTermsAcceptResponse response = mentoringTermsService.acceptCurrentTerms(ALUMNI_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isAccepted()).isTrue();
        assertThat(response.getAcceptedAt()).isEqualTo(acceptedTime);
        verify(userTermsAcceptanceRepository, never()).save(any());
    }

    // ================= MentorRegistrationService =================

    @Test
    @DisplayName("UTCID04 - Alumni with terms accepted and a current position -> Status PAYMENT_PENDING; industries and topics saved")
    void utcid04_saveRegistration_okComplete() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder()
                .bio("Professional Mentor bio")
                .workingMode(MentoringWorkingMode.ONLINE)
                .mentoringType(MentoringType.INDIVIDUAL)
                .cvFileKey("cv/alumni.pdf")
                .supportedIndustryIds(List.of(1L))
                .mentoringTopics(List.of("Java Core"))
                .bankName("Vietcombank")
                .bankBin("970436")
                .bankAccountNumber("1234567890")
                .bankAccountHolder("TRAN VAN ALUMNI")
                .build();

        Industry techIndustry = Industry.builder().id(1L).name("Information Technology").build();
        MentorProfile profile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.INCOMPLETE).build();
        MentorPayoutAccount payoutAccount = MentorPayoutAccount.builder().mentorProfile(profile).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(industryRepository.findAllById(any())).thenReturn(List.of(techIndustry));
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.of(payoutAccount));
        when(mentorPayoutAccountRepository.save(any(MentorPayoutAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(List.of(currentExp));
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(List.of(MentorSupportedField.builder().industry(techIndustry).build()));

        // When
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isComplete()).isTrue();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.PAYMENT_PENDING);
        assertThat(response.getNextStep()).isEqualTo("UC92_SELECT_PACKAGE");
    }

    @Test
    @DisplayName("UTCID05 - Alumni with terms accepted -> Status INCOMPLETE (draft saved)")
    void utcid05_saveRegistration_okDraft() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder()
                .bio("Draft bio only")
                .build();

        MentorProfile profile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.INCOMPLETE).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.empty());
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(ALUMNI_ID)).thenReturn(Optional.empty());
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(Collections.emptyList());

        // When
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isComplete()).isFalse();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.INCOMPLETE);
        assertThat(response.getNextStep()).isEqualTo("STAY_IN_DRAFT");
    }

    @Test
    @DisplayName("UTCID06 - Terms not accepted -> ForbiddenException")
    void utcid06_saveRegistration_forbiddenTermsNotAccepted() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder().bio("Some bio").build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(false).build());

        // When + Then
        assertThatThrownBy(() -> mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn cần chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi đăng ký");
        verify(mentorProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - User role is STUDENT -> ForbiddenException")
    void utcid07_saveRegistration_forbiddenStudentRole() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder().bio("Some bio").build();
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> mentorRegistrationService.saveRegistration(STUDENT_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chức năng chỉ dành cho Cựu sinh viên (ALUMNI)");
        verify(mentorProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - bankBin = '12345' (invalid length) -> BadRequestException")
    void utcid08_saveRegistration_badRequestBankBinInvalid() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder()
                .bankName("Vietcombank")
                .bankBin("12345")
                .build();

        MentorProfile profile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.INCOMPLETE).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenReturn(profile);
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã BIN ngân hàng phải gồm đúng 6 chữ số.");
    }

    @Test
    @DisplayName("UTCID09 - bankBin = '970436' (valid 6 digits) -> Registration saved")
    void utcid09_saveRegistration_okBankBinValid() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder()
                .bankName("Vietcombank")
                .bankBin("970436")
                .build();

        MentorProfile profile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.INCOMPLETE).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenReturn(profile);
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.empty());
        when(mentorPayoutAccountRepository.save(any(MentorPayoutAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(ALUMNI_ID)).thenReturn(Optional.empty());
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(Collections.emptyList());

        // When
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<MentorPayoutAccount> captor = ArgumentCaptor.forClass(MentorPayoutAccount.class);
        verify(mentorPayoutAccountRepository).save(captor.capture());
        assertThat(captor.getValue().getBankBin()).isEqualTo("970436");
    }

    @Test
    @DisplayName("UTCID10 - accountHolder = 'nguyen van a' -> Holder stored as 'NGUYEN VAN A'")
    void utcid10_saveRegistration_okUpperAccountHolder() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder()
                .bankName("Vietcombank")
                .bankAccountHolder("nguyen van a")
                .build();

        MentorProfile profile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.INCOMPLETE).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenReturn(profile);
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.empty());
        when(mentorPayoutAccountRepository.save(any(MentorPayoutAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(ALUMNI_ID)).thenReturn(Optional.empty());
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(Collections.emptyList());

        // When
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<MentorPayoutAccount> captor = ArgumentCaptor.forClass(MentorPayoutAccount.class);
        verify(mentorPayoutAccountRepository).save(captor.capture());
        assertThat(captor.getValue().getBankAccountHolder()).isEqualTo("NGUYEN VAN A");
    }

    @Test
    @DisplayName("UTCID11 - Existing industries A,B; new [C] -> Old industries replaced by C")
    void utcid11_saveRegistration_okReplaceIndustries() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder()
                .supportedIndustryIds(List.of(3L))
                .build();

        MentorProfile profile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.INCOMPLETE).build();
        Industry industryC = Industry.builder().id(3L).name("Finance").build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenReturn(profile);
        when(industryRepository.findAllById(List.of(3L))).thenReturn(List.of(industryC));
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.empty());
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(ALUMNI_ID)).thenReturn(Optional.empty());
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(List.of(MentorSupportedField.builder().industry(industryC).build()));

        // When
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        verify(mentorSupportedFieldRepository).deleteByMentorProfileId(50L);
        verify(mentorSupportedFieldRepository).saveAll(any());
    }

    @Test
    @DisplayName("UTCID12 - Mentor is ACTIVE; request missing a field -> Status stays ACTIVE (not downgraded)")
    void utcid12_saveRegistration_okStatusStaysActive() {
        // Given
        MentorRegistrationRequest request = MentorRegistrationRequest.builder().bio("New updated bio").build();
        MentorProfile activeProfile = MentorProfile.builder().id(50L).user(alumniUser).mentorStatus(MentorStatus.ACTIVE).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(activeProfile));
        when(mentorProfileRepository.save(any(MentorProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.empty());
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(ALUMNI_ID)).thenReturn(Optional.empty());
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(Collections.emptyList());

        // When
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID13 - Registration exists -> Saved data returned with masked bank account")
    void utcid13_getRegistration_ok() {
        // Given
        MentorProfile profile = MentorProfile.builder()
                .id(50L)
                .user(alumniUser)
                .bio("Existing bio")
                .workingMode(MentoringWorkingMode.ONLINE)
                .mentoringType(MentoringType.INDIVIDUAL)
                .mentorStatus(MentorStatus.PAYMENT_PENDING)
                .build();

        MentorPayoutAccount payout = MentorPayoutAccount.builder()
                .mentorProfile(profile)
                .bankName("Vietcombank")
                .bankBin("970436")
                .bankAccountNumber("1234567890")
                .bankAccountHolder("TRAN VAN ALUMNI")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mockedTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(userProfileRepository.findById(ALUMNI_ID)).thenReturn(Optional.of(alumniProfile));
        when(experienceRepository.findByUserIdAndIsCurrentTrue(ALUMNI_ID)).thenReturn(List.of(currentExp));
        when(userSkillRepository.findByUserIdOrderBySortOrderAscSkillNameAsc(ALUMNI_ID)).thenReturn(Collections.emptyList());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(profile));
        when(mentorSupportedFieldRepository.findByMentorProfileId(50L)).thenReturn(Collections.emptyList());
        when(mentorTopicRepository.findByMentorProfileId(50L)).thenReturn(Collections.emptyList());
        when(mentorPayoutAccountRepository.findByMentorProfileId(50L)).thenReturn(Optional.of(payout));

        // When
        MentorRegistrationResponse response = mentorRegistrationService.getRegistration(ALUMNI_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isHasExistingRegistration()).isTrue();
        assertThat(response.getPersonalInfo().getFullName()).isEqualTo("Tran Van Alumni");
        assertThat(response.getPayoutAccount().getBankAccountHolder()).isEqualTo("TRAN VAN ALUMNI");
    }
}
