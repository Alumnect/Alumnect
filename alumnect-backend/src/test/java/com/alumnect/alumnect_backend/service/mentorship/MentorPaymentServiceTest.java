package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.common.enums.TransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.payment.CreateMentorPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.dto.response.payment.MentorPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.payment.PaymentTransactionStatusResponse;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MentorPaymentServiceTest {

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
    private PayOSGateway payOSGateway;

    @Mock
    private MentoringTermsService mentoringTermsService;

    @Mock
    private MentorEligibilityService mentorEligibilityService;

    @InjectMocks
    private MentorPaymentServiceImpl mentorPaymentService;

    private User testUser;
    private MentorProfile testMentorProfile;
    private MentorPackage testPackage;
    private MentorSubscription testSubscription;
    private PaymentTransaction testTransaction;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mentorPaymentService, "expirationMinutes", 15);
        ReflectionTestUtils.setField(mentorPaymentService, "returnUrl", "http://localhost:5173/app/mentoring/subscription/payment-result");
        ReflectionTestUtils.setField(mentorPaymentService, "cancelUrl", "http://localhost:5173/app/mentoring/subscription");

        Role alumniRole = new Role();
        alumniRole.setName("ALUMNI");

        testUser = new User();
        testUser.setId(10L);
        testUser.setEmail("mentor.test@fpt.edu.vn");
        testUser.setRole(alumniRole);

        testMentorProfile = new MentorProfile();
        testMentorProfile.setId(20L);
        testMentorProfile.setUser(testUser);
        testMentorProfile.setMentorStatus(MentorStatus.PAYMENT_PENDING);

        testPackage = new MentorPackage();
        testPackage.setId(1L);
        testPackage.setName("Gói 3 Tháng Chuyên Nghiệp");
        testPackage.setPrice(new BigDecimal("300000"));
        testPackage.setDurationMonths(3);
        testPackage.setStatus(MentorPackageStatus.ACTIVE);

        testSubscription = MentorSubscription.builder()
                .id(100L)
                .mentorProfile(testMentorProfile)
                .mentorPackage(testPackage)
                .priceAtPurchase(testPackage.getPrice())
                .durationMonths(3)
                .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                .build();

        testTransaction = PaymentTransaction.builder()
                .id(500L)
                .orderCode(1234567890L)
                .user(testUser)
                .transactionType(TransactionType.MENTOR_SUBSCRIPTION)
                .mentorSubscription(testSubscription)
                .amount(new BigDecimal("300000"))
                .paymentStatus(PaymentStatus.PENDING)
                .paymentExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
    }

    @Test
    @DisplayName("Tạo Checkout thành công - Package hợp lệ, tạo giao dịch PayOS")
    void testCreateCheckout_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mentoringTermsService.getCurrentTermsStatus(testUser.getEmail()))
                .thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testMentorProfile));
        when(mentorPackageRepository.findById(testPackage.getId())).thenReturn(Optional.of(testPackage));
        when(mentorSubscriptionRepository.findFirstByMentorProfileIdAndStatusOrderByCreatedAtDesc(testMentorProfile.getId(), MentorSubscriptionStatus.PENDING_PAYMENT))
                .thenReturn(Optional.of(testSubscription));
        when(paymentTransactionRepository.findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(testSubscription.getId()))
                .thenReturn(Optional.empty());
        when(mentorSubscriptionRepository.save(any(MentorSubscription.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreatePaymentLinkResponse mockPayOSResponse = CreatePaymentLinkResponse.builder()
                .orderCode(999888777L)
                .amount(300000L)
                .description("ALUMNECT 888777")
                .paymentLinkId("link-abc-123")
                .checkoutUrl("https://pay.payos.vn/web/link-abc-123")
                .qrCode("vietqr_data_string")
                .accountNumber("99998888")
                .accountName("CONG TY ALUMNECT")
                .bin("970422")
                .currency("VND")
                .status(vn.payos.model.v2.paymentRequests.PaymentLinkStatus.PENDING)
                .build();

        when(payOSGateway.createPaymentLink(any())).thenReturn(mockPayOSResponse);
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction tx = invocation.getArgument(0);
            tx.setId(501L);
            return tx;
        });

        CreateMentorPaymentRequest request = new CreateMentorPaymentRequest(testPackage.getId());
        MentorPaymentCheckoutResponse response = mentorPaymentService.createMentorSubscriptionPayment(testUser.getEmail(), request);

        assertNotNull(response);
        assertEquals(501L, response.getTransactionId());
        assertEquals(new BigDecimal("300000"), response.getAmount());
        assertEquals("vietqr_data_string", response.getQrCodeUrl());
        assertEquals("https://pay.payos.vn/web/link-abc-123", response.getCheckoutUrl());
        assertEquals(PaymentStatus.PENDING, response.getPaymentStatus());

        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransaction.class));
    }

    @Test
    @DisplayName("Tạo Checkout thất bại - Package không tồn tại ném BadRequestException")
    void testCreateCheckout_PackageNotFound() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mentoringTermsService.getCurrentTermsStatus(testUser.getEmail()))
                .thenReturn(MentoringTermsStatusResponse.builder().accepted(true).build());
        when(mentorProfileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testMentorProfile));
        when(mentorPackageRepository.findById(999L)).thenReturn(Optional.empty());

        CreateMentorPaymentRequest request = new CreateMentorPaymentRequest(999L);
        assertThrows(BadRequestException.class, () ->
                mentorPaymentService.createMentorSubscriptionPayment(testUser.getEmail(), request)
        );
    }

    @Test
    @DisplayName("Tạo Checkout thất bại - Chưa chấp nhận điều khoản ném ForbiddenException")
    void testCreateCheckout_TermsNotAccepted() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mentoringTermsService.getCurrentTermsStatus(testUser.getEmail()))
                .thenReturn(MentoringTermsStatusResponse.builder().accepted(false).build());

        CreateMentorPaymentRequest request = new CreateMentorPaymentRequest(testPackage.getId());
        assertThrows(ForbiddenException.class, () ->
                mentorPaymentService.createMentorSubscriptionPayment(testUser.getEmail(), request)
        );
    }

    @Test
    @DisplayName("Webhook IPN xử lý thành công - Kích hoạt Subscription mới và tính lại MentorStatus")
    void testProcessWebhook_Success_NewSubscription() {
        Webhook webhook = mock(Webhook.class);
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(testTransaction.getOrderCode());
        when(webhookData.getCode()).thenReturn("00"); // 00 = PayOS success code
        when(webhookData.getAmount()).thenReturn(300000L);
        when(webhookData.getReference()).thenReturn("BANK-REF-999");

        when(payOSGateway.verifyPaymentWebhookData(webhook)).thenReturn(webhookData);
        when(paymentTransactionRepository.findForUpdateByOrderCode(testTransaction.getOrderCode()))
                .thenReturn(Optional.of(testTransaction));

        mentorPaymentService.handlePayOSWebhook(webhook);

        assertEquals(PaymentStatus.PAID, testTransaction.getPaymentStatus());
        assertEquals("BANK-REF-999", testTransaction.getPaymentReference());
        assertNotNull(testTransaction.getPaidAt());

        assertEquals(MentorSubscriptionStatus.ACTIVE, testSubscription.getStatus());
        assertNotNull(testSubscription.getStartDate());
        assertNotNull(testSubscription.getEndDate());

        verify(mentorSubscriptionRepository, times(1)).save(testSubscription);
        verify(paymentTransactionRepository, times(1)).save(testTransaction);
        verify(mentorEligibilityService, times(1)).recalculateMentorStatus(testMentorProfile.getId());
    }

    @Test
    @DisplayName("Webhook Idempotency - Không cộng trùng ngày nếu giao dịch đã PAID")
    void testProcessWebhook_Idempotent_AlreadyPaid() {
        testTransaction.setPaymentStatus(PaymentStatus.PAID);
        testTransaction.setPaidAt(Instant.now().minus(5, ChronoUnit.MINUTES));

        Webhook webhook = mock(Webhook.class);
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(testTransaction.getOrderCode());
        when(payOSGateway.verifyPaymentWebhookData(webhook)).thenReturn(webhookData);
        when(paymentTransactionRepository.findForUpdateByOrderCode(testTransaction.getOrderCode()))
                .thenReturn(Optional.of(testTransaction));

        mentorPaymentService.handlePayOSWebhook(webhook);

        // Should return early and NOT save subscription again
        verify(mentorSubscriptionRepository, never()).save(any());
        verify(mentorEligibilityService, never()).recalculateMentorStatus(anyLong());
    }

    @Test
    @DisplayName("Webhook Gia hạn khi còn hạn - Giữ nguyên số ngày còn lại và cộng thêm duration")
    void testProcessWebhook_Renewal_PreservesRemainingDays() {
        // Current subscription is active with 10 days remaining
        Instant currentEndDate = Instant.now().plus(10, ChronoUnit.DAYS);
        testSubscription.setStatus(MentorSubscriptionStatus.ACTIVE);
        testSubscription.setStartDate(Instant.now().minus(20, ChronoUnit.DAYS));
        testSubscription.setEndDate(currentEndDate);

        Webhook webhook = mock(Webhook.class);
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(testTransaction.getOrderCode());
        when(webhookData.getCode()).thenReturn("00");
        when(webhookData.getAmount()).thenReturn(300000L);

        when(payOSGateway.verifyPaymentWebhookData(webhook)).thenReturn(webhookData);
        when(paymentTransactionRepository.findForUpdateByOrderCode(testTransaction.getOrderCode()))
                .thenReturn(Optional.of(testTransaction));

        mentorPaymentService.handlePayOSWebhook(webhook);

        assertEquals(MentorSubscriptionStatus.ACTIVE, testSubscription.getStatus());
        // End date should be in the future beyond currentEndDate + 2.5 months
        assertTrue(testSubscription.getEndDate().isAfter(currentEndDate.plus(80, ChronoUnit.DAYS)));
        verify(mentorEligibilityService, times(1)).recalculateMentorStatus(testMentorProfile.getId());
    }

    @Test
    @DisplayName("Webhook Gia hạn khi đã hết hạn - Tính từ thời điểm thanh toán (paidAt)")
    void testProcessWebhook_Renewal_ExpiredStartsFromPaidAt() {
        // Current subscription was expired 5 days ago
        Instant pastEndDate = Instant.now().minus(5, ChronoUnit.DAYS);
        testSubscription.setStatus(MentorSubscriptionStatus.EXPIRED);
        testSubscription.setStartDate(Instant.now().minus(95, ChronoUnit.DAYS));
        testSubscription.setEndDate(pastEndDate);

        Webhook webhook = mock(Webhook.class);
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(testTransaction.getOrderCode());
        when(webhookData.getCode()).thenReturn("00");
        when(webhookData.getAmount()).thenReturn(300000L);

        when(payOSGateway.verifyPaymentWebhookData(webhook)).thenReturn(webhookData);
        when(paymentTransactionRepository.findForUpdateByOrderCode(testTransaction.getOrderCode()))
                .thenReturn(Optional.of(testTransaction));

        mentorPaymentService.handlePayOSWebhook(webhook);

        assertEquals(MentorSubscriptionStatus.ACTIVE, testSubscription.getStatus());
        assertNotNull(testSubscription.getStartDate());
        assertTrue(testSubscription.getEndDate().isAfter(Instant.now().plus(80, ChronoUnit.DAYS)));
        verify(mentorEligibilityService, times(1)).recalculateMentorStatus(testMentorProfile.getId());
    }

    @Test
    @DisplayName("Lấy trạng thái giao dịch - Polling trả về thông tin giao dịch")
    void testGetPaymentStatus_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(paymentTransactionRepository.findByOrderCodeAndUserId(testTransaction.getOrderCode(), testUser.getId()))
                .thenReturn(Optional.of(testTransaction));

        PaymentTransactionStatusResponse response = mentorPaymentService.getPaymentStatus(
                testUser.getEmail(), testTransaction.getOrderCode()
        );

        assertNotNull(response);
        assertEquals(testTransaction.getOrderCode(), response.getOrderCode());
        assertEquals(PaymentStatus.PENDING, response.getPaymentStatus());
    }

    @Test
    @DisplayName("Huỷ giao dịch - Người dùng chủ động huỷ khi đang PENDING")
    void testCancelPayment_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(paymentTransactionRepository.findByOrderCodeAndUserId(testTransaction.getOrderCode(), testUser.getId()))
                .thenReturn(Optional.of(testTransaction));

        PaymentTransactionStatusResponse response = mentorPaymentService.cancelPayment(
                testUser.getEmail(), testTransaction.getOrderCode()
        );

        assertNotNull(response);
        assertEquals(PaymentStatus.CANCELLED, response.getPaymentStatus());
        assertEquals(PaymentStatus.CANCELLED, testTransaction.getPaymentStatus());
        verify(payOSGateway, times(1)).cancelPaymentLink(eq(testTransaction.getOrderCode()), anyString());
    }

    @Test
    @DisplayName("Huỷ giao dịch thất bại - Giao dịch đã PAID không được phép huỷ")
    void testCancelPayment_AlreadyPaidThrowsBadRequestException() {
        testTransaction.setPaymentStatus(PaymentStatus.PAID);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(paymentTransactionRepository.findByOrderCodeAndUserId(testTransaction.getOrderCode(), testUser.getId()))
                .thenReturn(Optional.of(testTransaction));

        assertThrows(BadRequestException.class, () ->
                mentorPaymentService.cancelPayment(testUser.getEmail(), testTransaction.getOrderCode())
        );
    }
}
