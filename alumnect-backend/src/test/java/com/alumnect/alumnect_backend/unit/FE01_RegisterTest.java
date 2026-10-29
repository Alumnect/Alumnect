package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationType;
import com.alumnect.alumnect_backend.dao.auth.VerificationTokenRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.RoleRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSettingsRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;
import com.alumnect.alumnect_backend.entity.auth.VerificationToken;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSettings;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.auth.AuthMapper;
import com.alumnect.alumnect_backend.service.auth.AuthServiceImpl;
import com.alumnect.alumnect_backend.service.mail.MailService;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-01 Register a New Account.
 * Report sheet : FE-01 (Report5_Unit_Test.xlsx)
 * Functions    : AuthServiceImpl.register(), verifyEmail(), resendOtp()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-01 Register a New Account")
class FE01_RegisterTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock MajorRepository majorRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock UserSettingsRepository userSettingsRepository;
    @Mock VerificationTokenRepository tokenRepository;
    @Mock VerificationRequestRepository verificationRequestRepository;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock NotificationService notificationService;
    @Mock AuthMapper authMapper;
    @Mock MailService mailService;

    // ===== System under test =====
    @InjectMocks AuthServiceImpl authService;

    // ===== Test data =====
    private static final String EMAIL = "student@fpt.edu.vn";
    private RegisterRequest request;
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @BeforeEach
    void setUp() {
        request = RegisterRequest.builder()
                .fullName("Nguyen Van A")
                .email("  Student@FPT.edu.vn ")
                .password("Passw0rd1")
                .role("STUDENT")
                .majorId(1L)
                .studentCode("DE180001")
                .build();
    }

    // ================= register() =================

    @Test
    @DisplayName("UTCID01 - Register STUDENT success: user PENDING, email normalized, OTP sent")
    void utcid01_register_ok() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(Role.builder().id(1L).name("STUDENT").build()));
        when(majorRepository.findById(1L)).thenReturn(Optional.of(Major.builder().id(1L).build()));
        when(passwordEncoder.encode("Passw0rd1")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authMapper.toUserProfile(request)).thenReturn(UserProfile.builder().fullName("Nguyen Van A").build());
        when(tokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        // When
        authService.register(request);

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo(EMAIL);
        assertThat(saved.getPasswordHash()).isEqualTo("$2a$hashed");
        assertThat(saved.getAccountStatus()).isEqualTo(AccountStatus.PENDING);
        assertThat(saved.isEmailVerified()).isFalse();

        verify(userProfileRepository).save(any(UserProfile.class));
        verify(userSettingsRepository).save(any(UserSettings.class));
        verify(tokenRepository).invalidateOldTokens(saved, VerificationType.EMAIL_VERIFICATION);
        verify(mailService).sendVerificationEmail(eq(EMAIL), anyString(), eq("Nguyen Van A"));
    }

    @Test
    @DisplayName("UTCID02 - Register ALUMNI success -> VerificationRequest saved, OTP sent")
    void utcid02_register_okAlumni() {
        // Given
        request.setRole("ALUMNI");
        request.setProofUrl("https://cdn/proof.png");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);
        when(roleRepository.findByName("ALUMNI")).thenReturn(Optional.of(Role.builder().id(2L).name("ALUMNI").build()));
        when(majorRepository.findById(1L)).thenReturn(Optional.of(Major.builder().id(1L).build()));
        when(passwordEncoder.encode("Passw0rd1")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authMapper.toUserProfile(request)).thenReturn(UserProfile.builder().fullName("Nguyen Van A").build());
        when(verificationRequestRepository.findByUser(any(User.class))).thenReturn(Optional.empty());
        when(authMapper.toVerificationRequest(request)).thenReturn(VerificationRequest.builder().proofUrl(request.getProofUrl()).build());
        when(tokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        // When
        authService.register(request);

        // Then
        verify(verificationRequestRepository).save(any(VerificationRequest.class));
        verify(mailService).sendVerificationEmail(eq(EMAIL), anyString(), eq("Nguyen Van A"));
    }

    @Test
    @DisplayName("UTCID03 - Email already ACTIVE -> ConflictException")
    void utcid03_register_conflict() {
        // Given
        User active = User.builder().id(10L).email(EMAIL).accountStatus(AccountStatus.ACTIVE).build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(active));

        // When + Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email này đã được đăng ký và kích hoạt thành công. Vui lòng đăng nhập.");

        verify(userRepository, never()).save(any());
        verify(mailService, never()).sendVerificationEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("UTCID04 - Email WAITING_APPROVAL -> ConflictException")
    void utcid04_register_conflictWaitingApproval() {
        // Given
        User waiting = User.builder().id(10L).email(EMAIL).accountStatus(AccountStatus.WAITING_APPROVAL).build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(waiting));

        // When + Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Tài khoản của bạn đã xác thực email thành công và đang chờ quản trị viên phê duyệt. Vui lòng đợi admin duyệt.");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Student code already registered -> ConflictException")
    void utcid05_register_conflictStudentCode() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Mã số sinh viên này đã được đăng ký trong hệ thống.");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - Invalid role ADMIN -> BadRequestException")
    void utcid06_register_badRequestRole() {
        // Given
        request.setRole("ADMIN");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vai trò không hợp lệ để đăng ký: ADMIN");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Role ALUMNI with blank proofUrl -> BadRequestException")
    void utcid07_register_badRequestProofUrl() {
        // Given
        request.setRole("ALUMNI");
        request.setProofUrl("");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);
        when(roleRepository.findByName("ALUMNI")).thenReturn(Optional.of(Role.builder().name("ALUMNI").build()));
        when(majorRepository.findById(1L)).thenReturn(Optional.of(Major.builder().id(1L).build()));

        // When + Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ảnh minh chứng là bắt buộc khi đăng ký với vai trò Cựu sinh viên");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - Major id 99 does not exist -> ResourceNotFoundException")
    void utcid08_register_notFoundMajor() {
        // Given
        request.setMajorId(99L);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(Role.builder().name("STUDENT").build()));
        when(majorRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Chuyên ngành không tồn tại với ID: 99");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID09 - Re-submitted PENDING account -> reuse user, no new UserSettings, new OTP issued")
    void utcid09_register_okReSubmitted() {
        // Given
        User pending = User.builder().id(5L).email(EMAIL).accountStatus(AccountStatus.PENDING).build();
        UserProfile existingProfile = UserProfile.builder().userId(5L).fullName("Nguyen Van A").build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));
        when(userProfileRepository.existsByStudentCodeIgnoreCaseAndUserIdNot("DE180001", 5L)).thenReturn(false);
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(Role.builder().name("STUDENT").build()));
        when(majorRepository.findById(1L)).thenReturn(Optional.of(Major.builder().id(1L).build()));
        when(passwordEncoder.encode("Passw0rd1")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenReturn(pending);
        when(userProfileRepository.findById(5L)).thenReturn(Optional.of(existingProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(existingProfile);
        when(verificationRequestRepository.findByUser(pending)).thenReturn(Optional.empty());
        when(tokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        // When
        authService.register(request);

        // Then
        verify(userSettingsRepository, never()).save(any());
        verify(tokenRepository).invalidateOldTokens(pending, VerificationType.EMAIL_VERIFICATION);
        verify(mailService).sendVerificationEmail(eq(EMAIL), anyString(), eq("Nguyen Van A"));
    }

    @Test
    @DisplayName("UTCID10 - Password length = 8 (lower bound) -> valid, no violations")
    void utcid10_register_invalidPwd8Bound() {
        // Given
        request.setEmail(EMAIL);
        request.setPassword("Abcdefg1");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID11 - Password length = 7 (below lower bound) -> ConstraintViolation")
    void utcid11_register_invalidPwd7() {
        // Given
        request.setPassword("Abcde1");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Mật khẩu phải có độ dài từ 8 đến 100 ký tự");
    }

    @Test
    @DisplayName("UTCID12 - Password length = 101 (above upper bound) -> ConstraintViolation")
    void utcid12_register_invalidPwd101() {
        // Given
        request.setPassword("A1" + "a".repeat(100));

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Mật khẩu phải có độ dài từ 8 đến 100 ký tự");
    }

    @Test
    @DisplayName("UTCID13 - Password letters only (no digit) -> ConstraintViolation")
    void utcid13_register_invalidPwdNoDigit() {
        // Given
        request.setPassword("abcdefgh");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số");
    }

    // ================= verifyEmail() =================

    @Test
    @DisplayName("UTCID14 - Verify STUDENT success -> returns STUDENT, ACTIVE, welcome notification sent")
    void utcid14_verifyEmail_okStudent() {
        // Given
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        User user = User.builder().id(1L).email(EMAIL).role(studentRole).accountStatus(AccountStatus.PENDING).build();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token("123456")
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        // When
        String result = authService.verifyEmail(EMAIL, "123456");

        // Then
        assertThat(result).isEqualTo("STUDENT");
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.isAccountVerified()).isTrue();
        assertThat(token.isUsed()).isTrue();

        verify(tokenRepository).save(token);
        verify(userRepository).save(user);
        verify(notificationService).sendWelcomeNotification(user);
    }

    @Test
    @DisplayName("UTCID15 - Verify ALUMNI success -> returns ALUMNI, WAITING_APPROVAL, accountVerified=false")
    void utcid15_verifyEmail_okAlumni() {
        // Given
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        User user = User.builder().id(2L).email(EMAIL).role(alumniRole).accountStatus(AccountStatus.PENDING).build();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token("123456")
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        // When
        String result = authService.verifyEmail(EMAIL, "123456");

        // Then
        assertThat(result).isEqualTo("ALUMNI");
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.WAITING_APPROVAL);
        assertThat(user.isAccountVerified()).isFalse();
        verify(notificationService, never()).sendWelcomeNotification(any());
    }

    @Test
    @DisplayName("UTCID16 - Wrong OTP (failedAttempts=0) -> BadRequestException 4 attempts left")
    void utcid16_verifyEmail_badRequestWrongOtp() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).role(Role.builder().name("STUDENT").build()).build();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token("123456")
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.verifyEmail(EMAIL, "999999"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực không chính xác. Bạn còn 4 lần thử.");

        assertThat(token.getFailedAttempts()).isEqualTo(1);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("UTCID17 - Wrong OTP on 5th attempt -> BadRequestException locked")
    void utcid17_verifyEmail_badRequestLockedAt5() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).role(Role.builder().name("STUDENT").build()).build();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token("123456")
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(4)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.verifyEmail(EMAIL, "999999"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.");

        assertThat(token.getFailedAttempts()).isEqualTo(5);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("UTCID18 - OTP already locked (failedAttempts=5) -> BadRequestException")
    void utcid18_verifyEmail_badRequestAlreadyLocked() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).role(Role.builder().name("STUDENT").build()).build();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token("123456")
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(5)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.verifyEmail(EMAIL, "123456"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.");
    }

    @Test
    @DisplayName("UTCID19 - Expired OTP -> BadRequestException")
    void utcid19_verifyEmail_badRequestExpired() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).role(Role.builder().name("STUDENT").build()).build();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token("123456")
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.verifyEmail(EMAIL, "123456"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực đã hết hạn");
    }

    @Test
    @DisplayName("UTCID20 - Unknown email -> ResourceNotFoundException")
    void utcid20_verifyEmail_notFoundUnknownEmail() {
        // Given
        when(userRepository.findByEmail("unknown@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.verifyEmail("unknown@fpt.edu.vn", "123456"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng với email: unknown@fpt.edu.vn");
    }

    // ================= resendOtp() =================

    @Test
    @DisplayName("UTCID21 - Resend OTP cool-down (<5 min) -> BadRequestException")
    void utcid21_resendOtp_badRequestCoolDown() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).emailVerified(false).build();
        VerificationToken lastToken = VerificationToken.builder()
                .user(user)
                .createdAt(Instant.now().minus(2, ChronoUnit.MINUTES))
                .failedAttempts(0)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(lastToken));

        // When + Then
        assertThatThrownBy(() -> authService.resendOtp(EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("Vui lòng đợi ")
                .hasMessageEndingWith("trước khi yêu cầu gửi lại mã OTP mới.");

        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID22 - Resend OTP cool-down elapsed -> new OTP saved, email sent")
    void utcid22_resendOtp_ok() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).emailVerified(false).build();
        VerificationToken lastToken = VerificationToken.builder()
                .user(user)
                .createdAt(Instant.now().minus(6, ChronoUnit.MINUTES))
                .failedAttempts(0)
                .build();
        UserProfile profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(lastToken));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(tokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        // When
        authService.resendOtp(EMAIL);

        // Then
        verify(tokenRepository).invalidateOldTokens(user, VerificationType.EMAIL_VERIFICATION);
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(mailService).sendVerificationEmail(eq(EMAIL), anyString(), eq("Nguyen Van A"));
    }

    @Test
    @DisplayName("UTCID23 - Account already verified -> BadRequestException")
    void utcid23_resendOtp_badRequestAlreadyVerified() {
        // Given
        User user = User.builder().id(1L).email(EMAIL).emailVerified(true).build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> authService.resendOtp(EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản này đã được xác thực email trước đó");

        verify(tokenRepository, never()).save(any());
    }
}
