package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDisputeTicketRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminMentorCvResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminRevenueOverviewResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentorPackageMapper;
import com.alumnect.alumnect_backend.service.admin.AdminMentorCvServiceImpl;
import com.alumnect.alumnect_backend.service.admin.AdminMentorPackageServiceImpl;
import com.alumnect.alumnect_backend.service.admin.AdminRevenueServiceImpl;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit Test cho FE-64: Admin Mentoring - Mentors, CV, Plans & Revenue
 * Sheet: FE-64
 * Total Test Cases: 9
 */
@ExtendWith(MockitoExtension.class)
class FE64_AdminMentorRevenueTest {

    // Dependencies for AdminMentorCvService
    @Mock
    private MentorProfileRepository mentorProfileRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private ExperienceRepository experienceRepository;
    @Mock
    private MentorSupportedFieldRepository mentorSupportedFieldRepository;
    @Mock
    private MentorTopicRepository mentorTopicRepository;
    @Mock
    private MentorPayoutAccountRepository mentorPayoutAccountRepository;
    @Mock
    private MentorSubscriptionRepository mentorSubscriptionRepository;

    // Dependencies for AdminMentorPackageService
    @Mock
    private MentorPackageRepository mentorPackageRepository;
    @Mock
    private MentorPackageMapper mentorPackageMapper;

    // Dependencies for AdminRevenueService
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private MentoringDisputeTicketRepository disputeTicketRepository;
    @Mock
    private MentoringPaymentLedgerRepository ledgerRepository;

    private AdminMentorCvServiceImpl adminMentorCvService;
    private AdminMentorPackageServiceImpl adminMentorPackageService;
    private AdminRevenueServiceImpl adminRevenueService;

    private static final Long MENTOR_PROFILE_ID = 10L;
    private static final Long USER_ID = 100L;
    private User mentorUser;
    private MentorProfile mentorProfileWithCv;
    private MentorProfile mentorProfileNoCv;

    @BeforeEach
    void setUp() {
        adminMentorCvService = new AdminMentorCvServiceImpl(
                mentorProfileRepository,
                userProfileRepository,
                experienceRepository,
                mentorSupportedFieldRepository,
                mentorTopicRepository,
                mentorPayoutAccountRepository,
                mentorSubscriptionRepository
        );

        adminMentorPackageService = new AdminMentorPackageServiceImpl(
                mentorPackageRepository,
                mentorPackageMapper
        );

        adminRevenueService = new AdminRevenueServiceImpl(
                paymentTransactionRepository,
                disputeTicketRepository,
                ledgerRepository
        );

        mentorUser = User.builder()
                .id(USER_ID)
                .email("mentor@fpt.edu.vn")
                .profile(UserProfile.builder().fullName("Mentor Dang Cap").build())
                .build();

        mentorProfileWithCv = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .cvFileKey("cvs/mentor_dang_cap.pdf")
                .bio("Chuyên gia Spring Boot và Cloud")
                .build();

        mentorProfileNoCv = MentorProfile.builder()
                .id(20L)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .cvFileKey(null)
                .bio("Chưa nộp CV")
                .build();
    }

    @Test
    @DisplayName("UTCID01 - Mentors exist -> getMentorList -> Filtered page of mentors")
    void utcid01_getMentorList_ok() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<MentorProfile> page = new PageImpl<>(List.of(mentorProfileWithCv), pageable, 1);
        when(mentorProfileRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(mentorUser.getProfile()));

        // When
        PageResponse<AdminMentorCvResponse> response = adminMentorCvService.getMentorList(
                "Dang Cap", MentorStatus.ACTIVE, null, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getMentorName()).isEqualTo("Mentor Dang Cap");
    }

    @Test
    @DisplayName("UTCID02 - Mentor has a CV -> getMentorCv -> CV file information returned")
    void utcid02_getMentorCv_ok() {
        // Given
        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(mentorProfileWithCv));
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(mentorUser.getProfile()));

        // When
        AdminMentorCvResponse response = adminMentorCvService.getMentorCv(MENTOR_PROFILE_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getCvFileKey()).isEqualTo("cvs/mentor_dang_cap.pdf");
        assertThat(response.getMentorName()).isEqualTo("Mentor Dang Cap");
    }

    @Test
    @DisplayName("UTCID03 - Mentor has no CV -> getMentorCv -> ResourceNotFoundException: CV not found")
    void utcid03_getMentorCv_notFound() {
        // Given
        when(mentorProfileRepository.findById(20L)).thenReturn(Optional.of(mentorProfileNoCv));

        // When / Then
        assertThatThrownBy(() -> adminMentorCvService.getMentorCv(20L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Mentor này chưa cập nhật tệp CV lên hệ thống");
    }

    @Test
    @DisplayName("UTCID04 - Plans exist -> getAllPackages -> All plans including inactive ones")
    void utcid04_getAllPackages_ok() {
        // Given
        MentorPackage packActive = MentorPackage.builder()
                .id(1L)
                .name("Gói 1 tháng")
                .price(BigDecimal.valueOf(200000))
                .status(MentorPackageStatus.ACTIVE)
                .build();
        MentorPackage packInactive = MentorPackage.builder()
                .id(2L)
                .name("Gói 6 tháng")
                .price(BigDecimal.valueOf(1000000))
                .status(MentorPackageStatus.INACTIVE)
                .build();

        when(mentorPackageRepository.findAllByOrderByDurationMonthsAsc()).thenReturn(List.of(packActive, packInactive));
        when(mentorPackageMapper.toResponseList(any())).thenReturn(List.of(
                MentorPackageResponse.builder().id(1L).name("Gói 1 tháng").status(MentorPackageStatus.ACTIVE).build(),
                MentorPackageResponse.builder().id(2L).name("Gói 6 tháng").status(MentorPackageStatus.INACTIVE).build()
        ));

        // When
        List<MentorPackageResponse> responses = adminMentorPackageService.getAllPackages();

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getStatus()).isEqualTo(MentorPackageStatus.ACTIVE);
        assertThat(responses.get(1).getStatus()).isEqualTo(MentorPackageStatus.INACTIVE);
    }

    @Test
    @DisplayName("UTCID05 - Plan id 1 exists -> updatePackage -> Plan updated")
    void utcid05_updatePackage_ok() {
        // Given
        Long packageId = 1L;
        MentorPackage mentorPackage = MentorPackage.builder()
                .id(packageId)
                .name("Gói Cơ Bản")
                .price(BigDecimal.valueOf(200000))
                .status(MentorPackageStatus.ACTIVE)
                .build();

        AdminUpdateMentorPackageRequest request = AdminUpdateMentorPackageRequest.builder()
                .name("Gói Cơ Bản Mới")
                .price(BigDecimal.valueOf(250000))
                .status(MentorPackageStatus.INACTIVE)
                .description("Mô tả cập nhật")
                .build();

        when(mentorPackageRepository.findById(packageId)).thenReturn(Optional.of(mentorPackage));
        when(mentorPackageRepository.save(any(MentorPackage.class))).thenAnswer(i -> i.getArgument(0));
        when(mentorPackageMapper.toResponse(any(MentorPackage.class))).thenReturn(
                MentorPackageResponse.builder()
                        .id(packageId)
                        .name("Gói Cơ Bản Mới")
                        .price(BigDecimal.valueOf(250000))
                        .status(MentorPackageStatus.INACTIVE)
                        .build()
        );

        // When
        MentorPackageResponse response = adminMentorPackageService.updatePackage(packageId, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Gói Cơ Bản Mới");
        assertThat(response.getStatus()).isEqualTo(MentorPackageStatus.INACTIVE);
    }

    @Test
    @DisplayName("UTCID06 - Plan id 99 does not exist -> updatePackage -> ResourceNotFoundException: Không tìm thấy gói Mentor với ID: 99")
    void utcid06_updatePackage_notFound() {
        // Given
        Long nonExistentId = 99L;
        AdminUpdateMentorPackageRequest request = AdminUpdateMentorPackageRequest.builder()
                .price(BigDecimal.valueOf(500000))
                .status(MentorPackageStatus.ACTIVE)
                .build();

        when(mentorPackageRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> adminMentorPackageService.updatePackage(nonExistentId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy gói Mentor với ID: 99");
    }

    @Test
    @DisplayName("UTCID07 - Subscription revenue and resolved dispute fees exist -> getOverview -> Total = subscription revenue + dispute fees")
    void utcid07_getOverview_ok() {
        // Given
        Instant now = Instant.now();
        Instant from = now.minusSeconds(86400 * 30);
        Instant to = now;

        PaymentTransaction subTx = PaymentTransaction.builder()
                .id(1L)
                .user(mentorUser)
                .amount(BigDecimal.valueOf(500000))
                .paidAt(now.minusSeconds(86400))
                .build();

        MentoringDisputeTicket disputeTicket = MentoringDisputeTicket.builder()
                .id(2L)
                .student(mentorUser)
                .ticketCode("TCK-001")
                .disputeFee(BigDecimal.valueOf(50000))
                .resolvedAt(now.minusSeconds(86400))
                .build();

        when(paymentTransactionRepository.findAllPaidRevenueTransactions()).thenReturn(List.of(subTx));
        when(disputeTicketRepository.findAllResolvedFeeRevenue()).thenReturn(List.of(disputeTicket));
        when(ledgerRepository.sumAmountByTypeAndStatus(any(), any())).thenReturn(BigDecimal.ZERO);

        // When
        AdminRevenueOverviewResponse response = adminRevenueService.getOverview(from, to);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSubscriptionRevenue()).isEqualByComparingTo(BigDecimal.valueOf(500000));
        assertThat(response.getDisputeFeeRevenue()).isEqualByComparingTo(BigDecimal.valueOf(50000));
        assertThat(response.getTotalOwnedRevenue()).isEqualByComparingTo(BigDecimal.valueOf(550000));
        assertThat(response.getMonthlyRevenue()).hasSize(12);
    }

    @Test
    @DisplayName("UTCID08 - No transaction in range -> getOverview -> Totals are 0")
    void utcid08_getOverview_ok() {
        // Given
        Instant now = Instant.now();
        Instant from = now.minusSeconds(86400 * 30);
        Instant to = now;

        when(paymentTransactionRepository.findAllPaidRevenueTransactions()).thenReturn(Collections.emptyList());
        when(disputeTicketRepository.findAllResolvedFeeRevenue()).thenReturn(Collections.emptyList());
        when(ledgerRepository.sumAmountByTypeAndStatus(any(), any())).thenReturn(BigDecimal.ZERO);

        // When
        AdminRevenueOverviewResponse response = adminRevenueService.getOverview(from, to);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTotalOwnedRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getSubscriptionRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getDisputeFeeRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getSuccessfulTransactionCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("UTCID09 - from is after to -> getOverview -> BadRequestException: invalid date range")
    void utcid09_getOverview_badRequest() {
        // Given
        Instant now = Instant.now();
        Instant from = now.plusSeconds(3600);
        Instant to = now;

        // When / Then
        assertThatThrownBy(() -> adminRevenueService.getOverview(from, to))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Thời gian bắt đầu không được sau thời gian kết thúc");
    }
}
