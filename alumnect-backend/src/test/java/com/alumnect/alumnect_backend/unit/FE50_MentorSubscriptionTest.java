package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.SelectMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorSubscriptionResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentorPackageMapper;
import com.alumnect.alumnect_backend.mapper.mentorship.MentorSubscriptionMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentorSubscriptionServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
 * FE-50 Mentoring - Mentor Plan Selection & Payment.
 * Report sheet : FE-50 (Report5_Unit_Test.xlsx)
 * Functions    : MentorSubscriptionServiceImpl.getActivePackages(), selectPackage(), getMySubscription()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-50 Mentoring - Mentor Plan Selection & Payment")
class FE50_MentorSubscriptionTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private UserRepository userRepository;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private MentorPackageRepository mentorPackageRepository;

    @Mock
    private MentorSubscriptionRepository mentorSubscriptionRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private MentoringTermsService mentoringTermsService;

    @Mock
    private MentorPackageMapper mentorPackageMapper;

    @Mock
    private MentorSubscriptionMapper mentorSubscriptionMapper;

    // ===== System under test =====
    @InjectMocks
    private MentorSubscriptionServiceImpl mentorSubscriptionService;

    // ===== Test data =====
    private static final Long ALUMNI_ID = 10L;
    private static final Long STUDENT_ID = 20L;
    private static final Long PROFILE_ID = 50L;
    private static final Long PACKAGE_ID_1 = 1L;
    private static final Long PACKAGE_ID_2 = 2L;
    private static final Long INACTIVE_PACKAGE_ID = 9L;
    private static final String ALUMNI_EMAIL = "alumni@fpt.edu.vn";
    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";

    private User alumniUser;
    private User studentUser;
    private MentorProfile completeProfile;
    private MentorProfile incompleteProfile;
    private MentorPackage activePackage1;
    private MentorPackage activePackage2;
    private MentorPackage inactivePackage;

    @BeforeEach
    void setUp() {
        Role alumniRole = Role.builder().id(1L).name("ALUMNI").build();
        Role studentRole = Role.builder().id(2L).name("STUDENT").build();

        alumniUser = User.builder().id(ALUMNI_ID).email(ALUMNI_EMAIL).role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        studentUser = User.builder().id(STUDENT_ID).email(STUDENT_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        completeProfile = MentorProfile.builder()
                .id(PROFILE_ID)
                .user(alumniUser)
                .mentorStatus(MentorStatus.PAYMENT_PENDING)
                .build();

        incompleteProfile = MentorProfile.builder()
                .id(PROFILE_ID)
                .user(alumniUser)
                .mentorStatus(MentorStatus.INCOMPLETE)
                .build();

        activePackage1 = MentorPackage.builder()
                .id(PACKAGE_ID_1)
                .code("MENTOR_1M")
                .name("Standard 1 Month")
                .durationMonths(1)
                .price(BigDecimal.valueOf(100000))
                .status(MentorPackageStatus.ACTIVE)
                .build();

        activePackage2 = MentorPackage.builder()
                .id(PACKAGE_ID_2)
                .code("MENTOR_3M")
                .name("Standard 3 Months")
                .durationMonths(3)
                .price(BigDecimal.valueOf(270000))
                .status(MentorPackageStatus.ACTIVE)
                .build();

        inactivePackage = MentorPackage.builder()
                .id(INACTIVE_PACKAGE_ID)
                .code("MENTOR_OLD")
                .name("Old Package")
                .durationMonths(1)
                .price(BigDecimal.valueOf(50000))
                .status(MentorPackageStatus.INACTIVE)
                .build();
    }

    // ================= getActivePackages() =================

    @Test
    @DisplayName("UTCID01 - 3 ACTIVE packages exist -> 3 packages returned ordered by duration")
    void utcid01_getActivePackages_ok() {
        // Given
        MentorPackage activePackage3 = MentorPackage.builder().id(3L).code("MENTOR_6M").name("Standard 6 Months").durationMonths(6).status(MentorPackageStatus.ACTIVE).build();
        List<MentorPackage> activeList = List.of(activePackage1, activePackage2, activePackage3);
        List<MentorPackageResponse> responseList = List.of(
                MentorPackageResponse.builder().id(1L).code("MENTOR_1M").build(),
                MentorPackageResponse.builder().id(2L).code("MENTOR_3M").build(),
                MentorPackageResponse.builder().id(3L).code("MENTOR_6M").build()
        );

        when(mentorPackageRepository.findByStatusOrderByDurationMonthsAsc(MentorPackageStatus.ACTIVE)).thenReturn(activeList);
        when(mentorPackageMapper.toResponseList(activeList)).thenReturn(responseList);

        // When
        List<MentorPackageResponse> result = mentorSubscriptionService.getActivePackages();

        // Then
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getCode()).isEqualTo("MENTOR_1M");
        verify(mentorPackageRepository).findByStatusOrderByDurationMonthsAsc(MentorPackageStatus.ACTIVE);
    }

    // ================= selectPackage() =================

    @Test
    @DisplayName("UTCID02 - Complete profile, terms accepted, no subscription -> PENDING_PAYMENT subscription created")
    void utcid02_selectPackage_ok() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(PACKAGE_ID_1).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(completeProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID)).thenReturn(Collections.emptyList());
        when(mentorPackageRepository.findById(PACKAGE_ID_1)).thenReturn(Optional.of(activePackage1));
        when(mentorSubscriptionRepository.save(any(MentorSubscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MentorSubscriptionResponse expectedResponse = MentorSubscriptionResponse.builder()
                .packageId(PACKAGE_ID_1)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .priceAtPurchase(BigDecimal.valueOf(100000))
                .build();
        when(mentorSubscriptionMapper.toResponse(any())).thenReturn(expectedResponse);

        // When
        MentorSubscriptionResponse response = mentorSubscriptionService.selectPackage(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(MentorSubscriptionStatus.PENDING_PAYMENT);
        ArgumentCaptor<MentorSubscription> captor = ArgumentCaptor.forClass(MentorSubscription.class);
        verify(mentorSubscriptionRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(MentorSubscriptionStatus.PENDING_PAYMENT);
        assertThat(captor.getValue().getPriceAtPurchase()).isEqualTo(BigDecimal.valueOf(100000));
        assertThat(captor.getValue().getDurationMonths()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID03 - Pending subscription exists -> Subscription updated to new package")
    void utcid03_selectPackage_okSwitchPlan() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(PACKAGE_ID_2).build();

        MentorSubscription existingPending = MentorSubscription.builder()
                .id(100L)
                .mentorProfile(completeProfile)
                .mentorPackage(activePackage1)
                .priceAtPurchase(BigDecimal.valueOf(100000))
                .durationMonths(1)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .build();

        MentorSubscription extraPending = MentorSubscription.builder()
                .id(101L)
                .mentorProfile(completeProfile)
                .mentorPackage(activePackage1)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(completeProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID)).thenReturn(List.of(existingPending, extraPending));
        when(mentorPackageRepository.findById(PACKAGE_ID_2)).thenReturn(Optional.of(activePackage2));
        when(mentorSubscriptionRepository.save(any(MentorSubscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MentorSubscriptionResponse expectedResponse = MentorSubscriptionResponse.builder()
                .packageId(PACKAGE_ID_2)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .priceAtPurchase(BigDecimal.valueOf(270000))
                .build();
        when(mentorSubscriptionMapper.toResponse(any())).thenReturn(expectedResponse);

        // When
        MentorSubscriptionResponse response = mentorSubscriptionService.selectPackage(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(existingPending.getMentorPackage()).isEqualTo(activePackage2);
        assertThat(existingPending.getPriceAtPurchase()).isEqualTo(BigDecimal.valueOf(270000));
        assertThat(existingPending.getDurationMonths()).isEqualTo(3);
        assertThat(extraPending.getStatus()).isEqualTo(MentorSubscriptionStatus.CANCELLED);
    }

    @Test
    @DisplayName("UTCID04 - Mentor status INCOMPLETE -> BadRequestException")
    void utcid04_selectPackage_badRequestIncompleteProfile() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(PACKAGE_ID_1).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(incompleteProfile));

        // When + Then
        assertThatThrownBy(() -> mentorSubscriptionService.selectPackage(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn cần hoàn thiện thông tin hồ sơ Mentor trước khi chọn gói dịch vụ.");
        verify(mentorSubscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Terms not accepted -> ForbiddenException")
    void utcid05_selectPackage_forbiddenTermsNotAccepted() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(PACKAGE_ID_1).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(false).build());

        // When + Then
        assertThatThrownBy(() -> mentorSubscriptionService.selectPackage(ALUMNI_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn phải chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi chọn gói Mentor.");
        verify(mentorSubscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - Active subscription exists -> BadRequestException")
    void utcid06_selectPackage_badRequestAlreadyActive() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(PACKAGE_ID_1).build();

        MentorSubscription activeSub = MentorSubscription.builder()
                .id(100L)
                .mentorProfile(completeProfile)
                .mentorPackage(activePackage1)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(Instant.now().plus(20, ChronoUnit.DAYS))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(completeProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID)).thenReturn(List.of(activeSub));

        // When + Then
        assertThatThrownBy(() -> mentorSubscriptionService.selectPackage(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("Bạn đang có gói Mentor");
        verify(mentorSubscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Package not active -> BadRequestException")
    void utcid07_selectPackage_badRequestPackageNotActive() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(INACTIVE_PACKAGE_ID).build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(ALUMNI_EMAIL)).thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(completeProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID)).thenReturn(Collections.emptyList());
        when(mentorPackageRepository.findById(INACTIVE_PACKAGE_ID)).thenReturn(Optional.of(inactivePackage));

        // When + Then
        assertThatThrownBy(() -> mentorSubscriptionService.selectPackage(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động.");
        verify(mentorSubscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - User role is STUDENT -> ForbiddenException")
    void utcid08_selectPackage_forbiddenStudent() {
        // Given
        SelectMentorPackageRequest request = SelectMentorPackageRequest.builder().packageId(PACKAGE_ID_1).build();
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> mentorSubscriptionService.selectPackage(STUDENT_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chức năng chọn gói Mentor chỉ dành riêng cho Cựu sinh viên.");
        verify(mentorSubscriptionRepository, never()).save(any());
    }

    // ================= getMySubscription() =================

    @Test
    @DisplayName("UTCID09 - Active subscription exists -> Active subscription returned")
    void utcid09_getMySubscription_ok() {
        // Given
        MentorSubscription activeSub = MentorSubscription.builder()
                .id(100L)
                .mentorProfile(completeProfile)
                .mentorPackage(activePackage1)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(Instant.now().plus(20, ChronoUnit.DAYS))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(completeProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID)).thenReturn(List.of(activeSub));

        MentorSubscriptionResponse expectedResponse = MentorSubscriptionResponse.builder()
                .packageId(PACKAGE_ID_1)
                .status(MentorSubscriptionStatus.ACTIVE)
                .build();
        when(mentorSubscriptionMapper.toResponse(activeSub)).thenReturn(expectedResponse);

        // When
        MentorSubscriptionResponse response = mentorSubscriptionService.getMySubscription(ALUMNI_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(MentorSubscriptionStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID10 - No subscription exists -> ResourceNotFoundException")
    void utcid10_getMySubscription_notFound() {
        // Given
        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentorProfileRepository.findByUserId(ALUMNI_ID)).thenReturn(Optional.of(completeProfile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID)).thenReturn(Collections.emptyList());

        // When + Then
        assertThatThrownBy(() -> mentorSubscriptionService.getMySubscription(ALUMNI_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bạn chưa chọn gói dịch vụ Mentor nào.");
    }
}
