package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.payment.CreateMentorPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.dto.response.payment.MentorPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.service.mentorship.MentorEligibilityService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsService;
import com.alumnect.alumnect_backend.service.payment.MentorPaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-50 Mentoring - Mentor Plan Selection & Payment (payment part).
 * Report sheet : FE-50 (Report5_Unit_Test.xlsx)
 * Functions    : MentorPaymentServiceImpl.createMentorSubscriptionPayment(), getPaymentStatus()
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FE-50 Mentoring - Mentor Plan Selection & Payment (PayOS)")
class FE50_MentorPaymentTest {

    @Mock private UserRepository userRepository;
    @Mock private MentorProfileRepository mentorProfileRepository;
    @Mock private MentorPackageRepository mentorPackageRepository;
    @Mock private MentorSubscriptionRepository mentorSubscriptionRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private PayOSGateway payOSGateway;
    @Mock private MentoringTermsService mentoringTermsService;
    @Mock private MentorEligibilityService mentorEligibilityService;

    @InjectMocks
    private MentorPaymentServiceImpl paymentService;

    private static final String EMAIL = "alumni@fpt.edu.vn";

    private User alumni;
    private MentorProfile profile;
    private MentorPackage plan;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "expirationMinutes", 15);
        ReflectionTestUtils.setField(paymentService, "returnUrl", "http://localhost/return");
        ReflectionTestUtils.setField(paymentService, "cancelUrl", "http://localhost/cancel");

        alumni = User.builder().id(10L).email(EMAIL).role(Role.builder().id(1L).name("ALUMNI").build())
                .accountStatus(AccountStatus.ACTIVE).build();
        profile = MentorProfile.builder().id(50L).user(alumni).mentorStatus(MentorStatus.PAYMENT_PENDING).build();
        plan = MentorPackage.builder().id(1L).code("MENTOR_1M").name("Standard 1 Month").durationMonths(1)
                .price(BigDecimal.valueOf(100000)).status(MentorPackageStatus.ACTIVE).build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(alumni));
        when(mentoringTermsService.getCurrentTermsStatus(EMAIL))
                .thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(50L)).thenReturn(List.of());
        when(mentorPackageRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(mentorSubscriptionRepository.findFirstByMentorProfileIdAndStatusOrderByCreatedAtDesc(
                50L, MentorSubscriptionStatus.PENDING_PAYMENT)).thenReturn(Optional.empty());
        when(mentorSubscriptionRepository.save(any(MentorSubscription.class))).thenAnswer(inv -> {
            MentorSubscription s = inv.getArgument(0);
            if (s.getId() == null) s.setId(70L);
            return s;
        });
        when(paymentTransactionRepository.findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(70L))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> {
            PaymentTransaction t = inv.getArgument(0);
            t.setId(900L);
            return t;
        });
    }

    private CreateMentorPaymentRequest planRequest(Long packageId) {
        return CreateMentorPaymentRequest.builder().packageId(packageId).build();
    }

    // ================= createMentorSubscriptionPayment() =================

    @Test
    @DisplayName("UTCID11 - Valid ALUMNI selects plan 1 -> PayOS link created, PENDING transaction saved with DB price")
    void utcid11_createPayment_ok() {
        // Given
        CreatePaymentLinkResponse link = mock(CreatePaymentLinkResponse.class);
        when(link.getPaymentLinkId()).thenReturn("link-1");
        when(link.getCheckoutUrl()).thenReturn("https://pay.os/checkout/1");
        when(link.getQrCode()).thenReturn("qr-data");
        when(payOSGateway.createPaymentLink(any(CreatePaymentLinkRequest.class))).thenReturn(link);

        // When
        MentorPaymentCheckoutResponse result = paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L));

        // Then
        ArgumentCaptor<PaymentTransaction> saved = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(saved.capture());
        assertThat(saved.getValue().getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(saved.getValue().getAmount()).isEqualByComparingTo("100000");
        assertThat(saved.getValue().getPaymentMethod()).isEqualTo("PAYOS");
        assertThat(saved.getValue().getPaymentReference()).isEqualTo("link-1");
        assertThat(result.getCheckoutUrl()).isEqualTo("https://pay.os/checkout/1");
        assertThat(result.getPackageId()).isEqualTo(1L);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    @DisplayName("UTCID12 - Unknown email -> ResourceNotFoundException")
    void utcid12_createPayment_userNotFound() {
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment("ghost@fpt.edu.vn", planRequest(1L)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Người dùng không tồn tại.");
    }

    @Test
    @DisplayName("UTCID13 - STUDENT account -> ForbiddenException, PayOS not called")
    void utcid13_createPayment_notAlumni() {
        alumni.setRole(Role.builder().id(2L).name("STUDENT").build());

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L)))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chức năng thanh toán gói Mentor chỉ dành riêng cho Cựu sinh viên (ALUMNI).");
        verify(payOSGateway, never()).createPaymentLink(any());
    }

    @Test
    @DisplayName("UTCID14 - Mentoring terms not accepted -> ForbiddenException")
    void utcid14_createPayment_termsNotAccepted() {
        when(mentoringTermsService.getCurrentTermsStatus(EMAIL))
                .thenReturn(MentoringTermsStatusResponse.builder().accepted(false).build());

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L)))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn phải chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi thanh toán gói Mentor.");
    }

    @Test
    @DisplayName("UTCID15 - No Mentor profile -> BadRequestException")
    void utcid15_createPayment_noProfile() {
        when(mentorProfileRepository.findByUserId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn cần hoàn thiện thông tin hồ sơ Mentor trước khi thanh toán gói dịch vụ.");
    }

    @Test
    @DisplayName("UTCID16 - Mentor profile INCOMPLETE -> BadRequestException")
    void utcid16_createPayment_incompleteProfile() {
        profile.setMentorStatus(MentorStatus.INCOMPLETE);

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn cần hoàn thiện thông tin hồ sơ Mentor trước khi thanh toán gói dịch vụ.");
    }

    @Test
    @DisplayName("UTCID17 - Mentor already has an ACTIVE unexpired plan -> BadRequestException, no new payment")
    void utcid17_createPayment_alreadyActive() {
        MentorSubscription active = MentorSubscription.builder().id(60L).mentorProfile(profile).mentorPackage(plan)
                .status(MentorSubscriptionStatus.ACTIVE).endDate(Instant.now().plus(10, ChronoUnit.DAYS)).build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(50L)).thenReturn(List.of(active));

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đang hoạt động đến ngày");
        verify(payOSGateway, never()).createPaymentLink(any());
    }

    @Test
    @DisplayName("UTCID18 - Selected plan is INACTIVE -> BadRequestException")
    void utcid18_createPayment_inactivePlan() {
        plan.setStatus(MentorPackageStatus.INACTIVE);

        assertThatThrownBy(() -> paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động.");
    }

    @Test
    @DisplayName("UTCID19 - Unexpired PENDING transaction with the same amount -> reused, PayOS not called")
    void utcid19_createPayment_reusePending() {
        PaymentTransaction pending = PaymentTransaction.builder().id(901L).orderCode(123456L)
                .amount(BigDecimal.valueOf(100000)).paymentStatus(PaymentStatus.PENDING)
                .paymentExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .checkoutUrl("https://pay.os/checkout/old").build();
        when(paymentTransactionRepository.findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(70L))
                .thenReturn(Optional.of(pending));

        MentorPaymentCheckoutResponse result = paymentService.createMentorSubscriptionPayment(EMAIL, planRequest(1L));

        assertThat(result.getOrderCode()).isEqualTo(123456L);
        assertThat(result.getCheckoutUrl()).isEqualTo("https://pay.os/checkout/old");
        verify(payOSGateway, never()).createPaymentLink(any());
    }

    // ================= getPaymentStatus() =================

    @Test
    @DisplayName("UTCID20 - Order code does not belong to the user -> ResourceNotFoundException")
    void utcid20_getPaymentStatus_notFound() {
        when(paymentTransactionRepository.findByOrderCodeAndUserId(999L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentStatus(EMAIL, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Giao dịch không tồn tại hoặc bạn không có quyền truy cập.");
    }
}
