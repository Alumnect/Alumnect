package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorStatusResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.service.mentorship.MentorEligibilityService;
import com.alumnect.alumnect_backend.service.mentorship.MentorRegistrationService;
import com.alumnect.alumnect_backend.service.mentorship.MentorStatusServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsService;
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
 * FE-51 Mentoring - Mentor & Subscription Status.
 * Report sheet : FE-51 (Report5_Unit_Test.xlsx)
 * Functions    : MentorStatusServiceImpl.getMentorStatus()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-51 Mentoring - Mentor & Subscription Status")
class FE51_MentorStatusTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private MentorPayoutAccountRepository mentorPayoutAccountRepository;

    @Mock
    private MentorSubscriptionRepository mentorSubscriptionRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private MentoringTermsService mentoringTermsService;

    @Mock
    private MentorRegistrationService mentorRegistrationService;

    @Mock
    private MentorEligibilityService mentorEligibilityService;

    @InjectMocks
    private MentorStatusServiceImpl mentorStatusService;

    private static final String USER_EMAIL = "alumni@fpt.edu.vn";
    private static final Long USER_ID = 1L;
    private static final Long PROFILE_ID = 10L;

    private User alumniUser;
    private MentorProfile mentorProfile;
    private MentorPayoutAccount payoutAccount;
    private MentoringTermsStatusResponse termsAcceptedResponse;

    @BeforeEach
    void setUp() {
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        alumniUser = User.builder().id(USER_ID).email(USER_EMAIL).role(alumniRole).build();

        mentorProfile = MentorProfile.builder()
                .id(PROFILE_ID)
                .user(alumniUser)
                .cvFileKey("cvs/uuid_resume.pdf")
                .build();

        payoutAccount = MentorPayoutAccount.builder()
                .mentorProfileId(PROFILE_ID)
                .mentorProfile(mentorProfile)
                .bankName("Vietcombank")
                .bankAccountNumber("123456789")
                .bankAccountHolder("NGUYEN VAN A")
                .build();

        termsAcceptedResponse = MentoringTermsStatusResponse.builder()
                .accepted(true)
                .currentVersion("1.0")
                .acceptedAt(Instant.now().minus(10, ChronoUnit.DAYS))
                .build();
    }

    // ================= getMentorStatus() =================

    @Test
    @DisplayName("UTCID01 - Complete profile; ACTIVE subscription -> status ACTIVE with remaining days")
    void utcid01_getMentorStatus_okActive() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );

        Instant futureDate = Instant.now().plus(30, ChronoUnit.DAYS);
        MentorSubscription activeSub = MentorSubscription.builder()
                .id(50L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(futureDate)
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(List.of(activeSub));
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.ACTIVE);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.ACTIVE);
        assertThat(response.isActive()).isTrue();
        assertThat(response.getRemainingDays()).isGreaterThan(0L);
        assertThat(response.getNextAction()).isEqualTo("ACTIVE_DASHBOARD");
    }

    @Test
    @DisplayName("UTCID02 - Subscription end date passed -> status EXPIRED; nextAction RENEW_SUBSCRIPTION")
    void utcid02_getMentorStatus_okExpired() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );

        Instant pastDate = Instant.now().minus(5, ChronoUnit.DAYS);
        MentorSubscription expiredSub = MentorSubscription.builder()
                .id(50L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(pastDate)
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(List.of(expiredSub));
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.EXPIRED);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.EXPIRED);
        assertThat(response.getNextAction()).isEqualTo("RENEW_SUBSCRIPTION");
    }

    @Test
    @DisplayName("UTCID03 - Complete profile; no subscription -> status PAYMENT_PENDING; nextAction SELECT_PACKAGE")
    void utcid03_getMentorStatus_okPaymentPendingNoSub() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(Collections.emptyList());
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.PAYMENT_PENDING);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.PAYMENT_PENDING);
        assertThat(response.getNextAction()).isEqualTo("SELECT_PACKAGE");
    }

    @Test
    @DisplayName("UTCID04 - PENDING PayOS transaction not expired -> nextAction RESUME_PAYMENT")
    void utcid04_getMentorStatus_okResumePayment() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );

        MentorSubscription pendingSub = MentorSubscription.builder()
                .id(60L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(List.of(pendingSub));

        PaymentTransaction pendingTx = PaymentTransaction.builder()
                .id(200L)
                .orderCode(123456L)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
        when(paymentTransactionRepository.findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(60L))
                .thenReturn(Optional.of(pendingTx));
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.PAYMENT_PENDING);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getNextAction()).isEqualTo("RESUME_PAYMENT");
        assertThat(response.getPendingPaymentOrderCode()).isEqualTo(123456L);
    }

    @Test
    @DisplayName("UTCID05 - PENDING_PAYMENT subscription without transaction -> nextAction PAYMENT_CHECKOUT")
    void utcid05_getMentorStatus_okPaymentCheckout() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );

        MentorSubscription pendingSub = MentorSubscription.builder()
                .id(60L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(List.of(pendingSub));
        when(paymentTransactionRepository.findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(60L))
                .thenReturn(Optional.empty());
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.PAYMENT_PENDING);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getNextAction()).isEqualTo("PAYMENT_CHECKOUT");
    }

    @Test
    @DisplayName("UTCID06 - Terms not accepted -> status INCOMPLETE; nextAction ACCEPT_TERMS")
    void utcid06_getMentorStatus_okAcceptTerms() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        MentoringTermsStatusResponse unacceptedTerms = MentoringTermsStatusResponse.builder()
                .accepted(false)
                .build();
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(unacceptedTerms);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(Collections.emptyList());
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.INCOMPLETE);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMentorStatus()).isEqualTo(MentorStatus.INCOMPLETE);
        assertThat(response.getNextAction()).isEqualTo("ACCEPT_TERMS");
    }

    @Test
    @DisplayName("UTCID07 - Profile incomplete -> nextAction COMPLETE_PROFILE with missing requirements")
    void utcid07_getMentorStatus_okCompleteProfile() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(List.of("currentPosition")).build()
        );
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(Collections.emptyList());
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.INCOMPLETE);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getNextAction()).isEqualTo("COMPLETE_PROFILE");
        assertThat(response.isProfileComplete()).isFalse();
        assertThat(response.getMissingProfileFields()).contains("currentPosition");
    }

    @Test
    @DisplayName("UTCID08 - User never registered -> Default missing fields returned")
    void utcid08_getMentorStatus_okNeverRegistered() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isHasMentorProfile()).isFalse();
        assertThat(response.getMissingProfileFields()).contains("currentPosition", "workingMode", "mentoringType", "supportedIndustries");
    }

    @Test
    @DisplayName("UTCID09 - Bank account number '123456789' -> Masked as '**** **** 6789'")
    void utcid09_getMentorStatus_okMaskedBankStandard() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        payoutAccount.setBankAccountNumber("123456789");
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(Collections.emptyList());
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.INCOMPLETE);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMaskedAccountNumber()).isEqualTo("**** **** 6789");
    }

    @Test
    @DisplayName("UTCID10 - Bank account number with 4 digits -> Masked as '****' + number")
    void utcid10_getMentorStatus_okMaskedBankShort() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        payoutAccount.setBankAccountNumber("1234");
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(Collections.emptyList());
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.INCOMPLETE);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMaskedAccountNumber()).isEqualTo("****1234");
    }

    @Test
    @DisplayName("UTCID11 - Latest transaction CANCELLED -> PENDING_PAYMENT subscription set to CANCELLED")
    void utcid11_getMentorStatus_okCancelledTx() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );

        MentorSubscription pendingSub = MentorSubscription.builder()
                .id(77L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(List.of(pendingSub));

        PaymentTransaction cancelledTx = PaymentTransaction.builder()
                .id(300L)
                .paymentStatus(PaymentStatus.CANCELLED)
                .build();
        when(paymentTransactionRepository.findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(77L))
                .thenReturn(Optional.of(cancelledTx));
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.PAYMENT_PENDING);

        // When
        mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(pendingSub.getStatus()).isEqualTo(MentorSubscriptionStatus.CANCELLED);
        verify(mentorSubscriptionRepository).save(pendingSub);
    }

    @Test
    @DisplayName("UTCID12 - End date in the past -> remainingDays = 0")
    void utcid12_getMentorStatus_okRemainingDaysZero() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(mentoringTermsService.getCurrentTermsStatus(USER_EMAIL)).thenReturn(termsAcceptedResponse);
        when(mentorProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorPayoutAccountRepository.findByMentorProfileId(PROFILE_ID)).thenReturn(Optional.of(payoutAccount));
        when(mentorRegistrationService.getRegistration(USER_EMAIL)).thenReturn(
                MentorRegistrationResponse.builder().missingFields(Collections.emptyList()).build()
        );

        Instant pastDate = Instant.now().minus(10, ChronoUnit.DAYS);
        MentorSubscription expiredSub = MentorSubscription.builder()
                .id(88L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.EXPIRED)
                .endDate(pastDate)
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(PROFILE_ID))
                .thenReturn(List.of(expiredSub));
        when(mentorEligibilityService.recalculateMentorStatus(PROFILE_ID)).thenReturn(MentorStatus.EXPIRED);

        // When
        MentorStatusResponse response = mentorStatusService.getMentorStatus(USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getRemainingDays()).isEqualTo(0L);
    }

    @Test
    @DisplayName("UTCID13 - User role is STUDENT -> ForbiddenException")
    void utcid13_getMentorStatus_forbiddenStudent() {
        // Given
        Role studentRole = Role.builder().id(3L).name("STUDENT").build();
        User studentUser = User.builder().id(2L).email(USER_EMAIL).role(studentRole).build();
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> mentorStatusService.getMentorStatus(USER_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chức năng chỉ dành cho Cựu sinh viên (ALUMNI)");
        verify(mentorProfileRepository, never()).findByUserId(any());
    }
}
