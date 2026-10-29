package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.verification.AdminReviewVerificationDto;
import com.alumnect.alumnect_backend.dto.response.verification.AdminVerificationRequestDto;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.verification.AdminVerificationMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.service.verification.AdminVerificationServiceImpl;
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
import org.springframework.data.jpa.domain.Specification;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-17_Alumni Verification Management Queue.
 * Report sheet : FE-17 (Report5_Unit_Test.xlsx)
 * Functions    : AdminVerificationServiceImpl.getVerificationRequests(), AdminVerificationServiceImpl.reviewVerificationRequest()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-17 Alumni Verification Management Queue")
class FE17_AdminAlumniVerificationTest {

    @Mock
    private VerificationRequestRepository verificationRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private AdminVerificationMapper adminVerificationMapper;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminVerificationServiceImpl adminVerificationService;

    private Validator validator;
    private User adminUser;
    private User alumniUser;
    private VerificationRequest request9;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();

        adminUser = User.builder()
                .id(99L)
                .email("admin@fpt.edu.vn")
                .role(Role.builder().name("ADMIN").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        alumniUser = User.builder()
                .id(10L)
                .email("alumni@fpt.edu.vn")
                .role(Role.builder().name("ALUMNI").build())
                .accountStatus(AccountStatus.WAITING_APPROVAL)
                .isAccountVerified(false)
                .build();

        request9 = VerificationRequest.builder()
                .id(9L)
                .user(alumniUser)
                .status(VerificationStatus.PENDING)
                .build();
    }

    // ================= getVerificationRequests =================

    @Test
    @DisplayName("UTCID01 - 2 PENDING requests exist -> profiles loaded in batch query")
    @SuppressWarnings("unchecked")
    void utcid01_getVerificationRequests_twoRequestsBatchProfile() {
        // Given
        User u2 = User.builder().id(20L).email("u2@fpt.edu.vn").build();
        VerificationRequest r2 = VerificationRequest.builder().id(2L).user(u2).status(VerificationStatus.PENDING).build();
        Page<VerificationRequest> page = new PageImpl<>(List.of(request9, r2), PageRequest.of(0, 10), 2);
        when(verificationRequestRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        UserProfile p1 = UserProfile.builder().userId(10L).fullName("Alum One").build();
        UserProfile p2 = UserProfile.builder().userId(20L).fullName("Alum Two").build();
        when(userProfileRepository.findAllById(List.of(10L, 20L))).thenReturn(List.of(p1, p2));

        AdminVerificationRequestDto dto1 = AdminVerificationRequestDto.builder().id(9L).build();
        AdminVerificationRequestDto dto2 = AdminVerificationRequestDto.builder().id(2L).build();
        when(adminVerificationMapper.toDto(request9, p1)).thenReturn(dto1);
        when(adminVerificationMapper.toDto(r2, p2)).thenReturn(dto2);

        // When
        PageResponse<AdminVerificationRequestDto> result = adminVerificationService.getVerificationRequests("PENDING", 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(2);
        verify(userProfileRepository).findAllById(List.of(10L, 20L));
    }

    @Test
    @DisplayName("UTCID02 - No request matches -> empty PageResponse and profile query skipped")
    @SuppressWarnings("unchecked")
    void utcid02_getVerificationRequests_noMatchesSkipsProfileQuery() {
        // Given
        Page<VerificationRequest> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(verificationRequestRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<AdminVerificationRequestDto> result = adminVerificationService.getVerificationRequests("APPROVED", 0, 10);

        // Then
        assertThat(result.getContent()).isEmpty();
        verify(userProfileRepository, never()).findAllById(anyList());
    }

    @Test
    @DisplayName("UTCID03 - Invalid status filter is ignored without exception")
    @SuppressWarnings("unchecked")
    void utcid03_getVerificationRequests_invalidStatusFilterIgnored() {
        // Given
        Page<VerificationRequest> page = new PageImpl<>(List.of(request9), PageRequest.of(0, 10), 1);
        when(verificationRequestRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(userProfileRepository.findAllById(List.of(10L))).thenReturn(Collections.emptyList());

        AdminVerificationRequestDto dto = AdminVerificationRequestDto.builder().id(9L).build();
        when(adminVerificationMapper.toDto(request9, null)).thenReturn(dto);

        // When
        PageResponse<AdminVerificationRequestDto> result = adminVerificationService.getVerificationRequests("UNKNOWN", 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
    }

    // ================= reviewVerificationRequest =================

    @Test
    @DisplayName("UTCID04 - APPROVED decision activates user, verifies account and sends welcome notification")
    void utcid04_reviewVerificationRequest_approved() {
        // Given
        when(verificationRequestRepository.findById(9L)).thenReturn(Optional.of(request9));
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder()
                .status("APPROVED")
                .reviewNote("Proof is valid")
                .build();

        // When
        adminVerificationService.reviewVerificationRequest(9L, dto, adminUser);

        // Then
        assertThat(request9.getStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(request9.getReviewedBy()).isEqualTo(adminUser);
        assertThat(request9.getReviewNote()).isEqualTo("Proof is valid");
        assertThat(request9.getReviewedAt()).isNotNull();

        assertThat(alumniUser.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(alumniUser.isAccountVerified()).isTrue();
        verify(userRepository).save(alumniUser);
        verify(verificationRequestRepository).save(request9);
        verify(notificationService).sendWelcomeNotification(alumniUser);
    }

    @Test
    @DisplayName("UTCID05 - REJECTED decision locks user, unsets verified and saves")
    void utcid05_reviewVerificationRequest_rejected() {
        // Given
        when(verificationRequestRepository.findById(9L)).thenReturn(Optional.of(request9));
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder()
                .status("REJECTED")
                .reviewNote("Blurry proof")
                .build();

        // When
        adminVerificationService.reviewVerificationRequest(9L, dto, adminUser);

        // Then
        assertThat(request9.getStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(request9.getReviewNote()).isEqualTo("Blurry proof");
        assertThat(alumniUser.getAccountStatus()).isEqualTo(AccountStatus.LOCKED);
        assertThat(alumniUser.isAccountVerified()).isFalse();
        verify(userRepository).save(alumniUser);
        verify(verificationRequestRepository).save(request9);
        verify(notificationService, never()).sendWelcomeNotification(any());
    }

    @Test
    @DisplayName("UTCID06 - Case-insensitive decision 'approved' with null note")
    void utcid06_reviewVerificationRequest_caseInsensitive() {
        // Given
        when(verificationRequestRepository.findById(9L)).thenReturn(Optional.of(request9));
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder()
                .status("approved")
                .reviewNote(null)
                .build();

        // When
        adminVerificationService.reviewVerificationRequest(9L, dto, adminUser);

        // Then
        assertThat(request9.getStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(request9.getReviewNote()).isNull();
        assertThat(alumniUser.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID07 - No request with id 404 -> ResourceNotFoundException")
    void utcid07_reviewVerificationRequest_notFound() {
        // Given
        when(verificationRequestRepository.findById(404L)).thenReturn(Optional.empty());
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder().status("APPROVED").build();

        // When + Then
        assertThatThrownBy(() -> adminVerificationService.reviewVerificationRequest(404L, dto, adminUser))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy phiếu yêu cầu xác minh với ID: 404");
    }

    @Test
    @DisplayName("UTCID08 - Request already APPROVED -> BadRequestException already processed")
    void utcid08_reviewVerificationRequest_alreadyProcessed() {
        // Given
        request9.setStatus(VerificationStatus.APPROVED);
        when(verificationRequestRepository.findById(9L)).thenReturn(Optional.of(request9));
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder().status("REJECTED").build();

        // When + Then
        assertThatThrownBy(() -> adminVerificationService.reviewVerificationRequest(9L, dto, adminUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiếu yêu cầu xác minh này đã được xử lý từ trước");
    }

    @Test
    @DisplayName("UTCID09 - Invalid decision status 'MAYBE' -> BadRequestException")
    void utcid09_reviewVerificationRequest_invalidDecision() {
        // Given
        when(verificationRequestRepository.findById(9L)).thenReturn(Optional.of(request9));
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder().status("MAYBE").build();

        // When + Then
        assertThatThrownBy(() -> adminVerificationService.reviewVerificationRequest(9L, dto, adminUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Quyết định phê duyệt không hợp lệ: MAYBE");
    }

    // ================= DTO Validation =================

    @Test
    @DisplayName("UTCID10 - DTO validation: reviewNote 500 chars (max boundary) passes")
    void utcid10_validation_reviewNote500Chars() {
        // Given
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder()
                .status("APPROVED")
                .reviewNote("a".repeat(500))
                .build();

        // When
        Set<ConstraintViolation<AdminReviewVerificationDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID11 - DTO validation: reviewNote 501 chars -> ConstraintViolation")
    void utcid11_validation_reviewNote501Chars() {
        // Given
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder()
                .status("APPROVED")
                .reviewNote("a".repeat(501))
                .build();

        // When
        Set<ConstraintViolation<AdminReviewVerificationDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Nhận xét phê duyệt tối đa 500 ký tự");
    }

    @Test
    @DisplayName("UTCID12 - DTO validation: status 'PENDING' violates APPROVED|REJECTED pattern")
    void utcid12_validation_invalidStatusPattern() {
        // Given
        AdminReviewVerificationDto dto = AdminReviewVerificationDto.builder()
                .status("PENDING")
                .build();

        // When
        Set<ConstraintViolation<AdminReviewVerificationDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).isNotEmpty();
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Trạng thái phê duyệt chỉ có thể là APPROVED hoặc REJECTED");
    }
}
