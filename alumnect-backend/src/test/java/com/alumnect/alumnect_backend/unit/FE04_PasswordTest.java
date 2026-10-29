package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationType;
import com.alumnect.alumnect_backend.dao.auth.VerificationTokenRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.auth.ForgotPasswordRequest;
import com.alumnect.alumnect_backend.dto.request.auth.ResetPasswordRequest;
import com.alumnect.alumnect_backend.dto.request.auth.VerifyResetOtpRequest;
import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
import com.alumnect.alumnect_backend.entity.auth.VerificationToken;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.user.UserProfileMapper;
import com.alumnect.alumnect_backend.service.auth.AuthServiceImpl;
import com.alumnect.alumnect_backend.service.mail.MailService;
import com.alumnect.alumnect_backend.service.user.UserServiceImpl;
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
 * FE-04 Manage Password (Change / Forgot).
 * Report sheet : FE-04 (Report5_Unit_Test.xlsx)
 * Functions    : AuthServiceImpl.forgotPassword(), verifyResetOtp(), resetPassword(), UserServiceImpl.changePassword()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-04 Manage Password (Change / Forgot)")
class FE04_PasswordTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock VerificationTokenRepository tokenRepository;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock MailService mailService;

    @Mock UserProfileMapper userProfileMapper;
    @Mock ExperienceRepository experienceRepository;
    @Mock MajorRepository majorRepository;
    @Mock UserSkillRepository userSkillRepository;
    @Mock FollowRepository followRepository;

    // ===== System under test =====
    @InjectMocks AuthServiceImpl authService;
    private UserServiceImpl userService;

    // ===== Test data =====
    private static final String EMAIL = "student@fpt.edu.vn";
    private static final String OLD_PASS = "Passw0rd1";
    private static final String NEW_PASS = "NewPassw0rd2";
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private User activeUser;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(
                userRepository,
                userProfileRepository,
                userProfileMapper,
                passwordEncoder,
                experienceRepository,
                majorRepository,
                userSkillRepository,
                followRepository
        );

        activeUser = User.builder()
                .id(1L)
                .email(EMAIL)
                .passwordHash("$2a$encodedOld")
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
    }

    // ================= forgotPassword() =================

    @Test
    @DisplayName("UTCID01 - ACTIVE account & no previous OTP -> new OTP created and email sent")
    void utcid01_forgotPassword_ok() {
        // Given
        ForgotPasswordRequest req = new ForgotPasswordRequest("  Student@FPT.edu.vn ");
        UserProfile profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.empty());
        when(tokenRepository.findByToken(anyString())).thenReturn(Optional.empty());
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));

        // When
        authService.forgotPassword(req);

        // Then
        verify(tokenRepository).invalidateOldTokens(activeUser, VerificationType.PASSWORD_RESET);
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(mailService).sendPasswordResetEmail(eq(EMAIL), anyString(), eq("Nguyen Van A"));
    }

    @Test
    @DisplayName("UTCID02 - Unknown email -> ResourceNotFoundException")
    void utcid02_forgotPassword_notFound() {
        // Given
        ForgotPasswordRequest req = new ForgotPasswordRequest("unknown@fpt.edu.vn");
        when(userRepository.findByEmail("unknown@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.forgotPassword(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng với email: unknown@fpt.edu.vn");

        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID03 - Account LOCKED -> BadRequestException")
    void utcid03_forgotPassword_badRequestLocked() {
        // Given
        activeUser.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When + Then
        assertThatThrownBy(() -> authService.forgotPassword(new ForgotPasswordRequest(EMAIL)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");

        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID04 - Account PENDING -> BadRequestException")
    void utcid04_forgotPassword_badRequestPending() {
        // Given
        activeUser.setAccountStatus(AccountStatus.PENDING);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When + Then
        assertThatThrownBy(() -> authService.forgotPassword(new ForgotPasswordRequest(EMAIL)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản của bạn chưa được xác thực email. Vui lòng kiểm tra hòm thư để xác thực tài khoản hoặc thực hiện đăng ký lại.");

        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Cool-down (<5 min) -> BadRequestException")
    void utcid05_forgotPassword_badRequestCoolDown() {
        // Given
        VerificationToken lastToken = VerificationToken.builder()
                .user(activeUser)
                .createdAt(Instant.now().minus(2, ChronoUnit.MINUTES))
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(lastToken));

        // When + Then
        assertThatThrownBy(() -> authService.forgotPassword(new ForgotPasswordRequest(EMAIL)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("Vui lòng đợi ")
                .hasMessageEndingWith("trước khi yêu cầu gửi lại mã OTP mới.");

        verify(mailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("UTCID06 - Cool-down elapsed & missing profile -> fallback name = email, OTP emailed")
    void utcid06_forgotPassword_okFallbackName() {
        // Given
        VerificationToken lastToken = VerificationToken.builder()
                .user(activeUser)
                .createdAt(Instant.now().minus(6, ChronoUnit.MINUTES))
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(lastToken));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());
        when(tokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        // When
        authService.forgotPassword(new ForgotPasswordRequest(EMAIL));

        // Then
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(mailService).sendPasswordResetEmail(eq(EMAIL), anyString(), eq(EMAIL));
    }

    // ================= verifyResetOtp() =================

    @Test
    @DisplayName("UTCID07 - Valid OTP -> returns void, OTP stays unused")
    void utcid07_verifyResetOtp_ok() {
        // Given
        VerifyResetOtpRequest req = new VerifyResetOtpRequest(EMAIL, "123456");
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        // When
        authService.verifyResetOtp(req);

        // Then
        assertThat(token.isUsed()).isFalse();
    }

    @Test
    @DisplayName("UTCID08 - Wrong OTP -> BadRequestException 4 attempts left")
    void utcid08_verifyResetOtp_badRequestWrongOtp() {
        // Given
        VerifyResetOtpRequest req = new VerifyResetOtpRequest(EMAIL, "999999");
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.verifyResetOtp(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực không chính xác. Bạn còn 4 lần thử.");

        assertThat(token.getFailedAttempts()).isEqualTo(1);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("UTCID09 - Expired OTP -> BadRequestException")
    void utcid09_verifyResetOtp_badRequestExpired() {
        // Given
        VerifyResetOtpRequest req = new VerifyResetOtpRequest(EMAIL, "123456");
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.verifyResetOtp(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực đã hết hạn");
    }

    @Test
    @DisplayName("UTCID10 - No reset request -> ResourceNotFoundException")
    void utcid10_verifyResetOtp_notFound() {
        // Given
        VerifyResetOtpRequest req = new VerifyResetOtpRequest(EMAIL, "123456");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.verifyResetOtp(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy yêu cầu đặt lại mật khẩu nào cho tài khoản này");
    }

    // ================= resetPassword() =================

    @Test
    @DisplayName("UTCID11 - Valid OTP -> OTP marked used, password hash updated")
    void utcid11_resetPassword_ok() {
        // Given
        ResetPasswordRequest req = new ResetPasswordRequest(EMAIL, "123456", NEW_PASS);
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.encode(NEW_PASS)).thenReturn("$2a$encodedNew");

        // When
        authService.resetPassword(req);

        // Then
        assertThat(token.isUsed()).isTrue();
        assertThat(activeUser.getPasswordHash()).isEqualTo("$2a$encodedNew");
        verify(tokenRepository).save(token);
        verify(userRepository).save(activeUser);
    }

    @Test
    @DisplayName("UTCID12 - OTP already used -> BadRequestException")
    void utcid12_resetPassword_badRequestAlreadyUsed() {
        // Given
        ResetPasswordRequest req = new ResetPasswordRequest(EMAIL, "123456", NEW_PASS);
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(true)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.resetPassword(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực này đã được sử dụng trước đó");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - Wrong OTP -> BadRequestException 4 attempts left")
    void utcid13_resetPassword_badRequestWrongOtp() {
        // Given
        ResetPasswordRequest req = new ResetPasswordRequest(EMAIL, "999999", NEW_PASS);
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(0)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.resetPassword(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực không chính xác. Bạn còn 4 lần thử.");

        assertThat(token.getFailedAttempts()).isEqualTo(1);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("UTCID14 - Wrong OTP on 5th attempt -> BadRequestException locked")
    void utcid14_resetPassword_badRequestLockedAt5() {
        // Given
        ResetPasswordRequest req = new ResetPasswordRequest(EMAIL, "999999", NEW_PASS);
        VerificationToken token = VerificationToken.builder()
                .token("123456")
                .user(activeUser)
                .type(VerificationType.PASSWORD_RESET)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .failedAttempts(4)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(activeUser, VerificationType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        // When + Then
        assertThatThrownBy(() -> authService.resetPassword(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.");

        assertThat(token.getFailedAttempts()).isEqualTo(5);
        verify(tokenRepository).save(token);
    }

    // ================= changePassword() =================

    @Test
    @DisplayName("UTCID15 - Change password success -> password hash updated")
    void utcid15_changePassword_ok() {
        // Given
        ChangePasswordRequest req = new ChangePasswordRequest(OLD_PASS, NEW_PASS, NEW_PASS);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(OLD_PASS, "$2a$encodedOld")).thenReturn(true);
        when(passwordEncoder.encode(NEW_PASS)).thenReturn("$2a$encodedNew");

        // When
        userService.changePassword(EMAIL, req);

        // Then
        assertThat(activeUser.getPasswordHash()).isEqualTo("$2a$encodedNew");
        verify(userRepository).save(activeUser);
    }

    @Test
    @DisplayName("UTCID16 - Old password does not match -> BadRequestException")
    void utcid16_changePassword_badRequestWrongOld() {
        // Given
        ChangePasswordRequest req = new ChangePasswordRequest("wrongPass", NEW_PASS, NEW_PASS);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPass", "$2a$encodedOld")).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> userService.changePassword(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mật khẩu hiện tại không chính xác.");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID17 - New password same as old password -> BadRequestException")
    void utcid17_changePassword_badRequestSamePass() {
        // Given
        ChangePasswordRequest req = new ChangePasswordRequest(OLD_PASS, OLD_PASS, OLD_PASS);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(OLD_PASS, "$2a$encodedOld")).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> userService.changePassword(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mật khẩu mới không được trùng với mật khẩu hiện tại.");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID18 - Confirm password does not match new password -> BadRequestException")
    void utcid18_changePassword_badRequestMismatchConfirm() {
        // Given
        ChangePasswordRequest req = new ChangePasswordRequest(OLD_PASS, NEW_PASS, "differentPass");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(OLD_PASS, "$2a$encodedOld")).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> userService.changePassword(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Xác nhận mật khẩu mới không trùng khớp.");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID19 - Google account (passwordHash null) -> BadRequestException")
    void utcid19_changePassword_badRequestGoogleAccount() {
        // Given
        activeUser.setPasswordHash(null);
        ChangePasswordRequest req = new ChangePasswordRequest(OLD_PASS, NEW_PASS, NEW_PASS);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When + Then
        assertThatThrownBy(() -> userService.changePassword(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mật khẩu hiện tại không chính xác.");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID20 - Unknown email -> ResourceNotFoundException")
    void utcid20_changePassword_notFound() {
        // Given
        ChangePasswordRequest req = new ChangePasswordRequest(OLD_PASS, NEW_PASS, NEW_PASS);
        when(userRepository.findByEmail("unknown@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> userService.changePassword("unknown@fpt.edu.vn", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng với email: unknown@fpt.edu.vn");

        verify(userRepository, never()).save(any());
    }

    // ================= DTO Validation =================

    @Test
    @DisplayName("UTCID21 - ChangePasswordRequest newPassword length = 8 -> valid")
    void utcid21_changePassword_invalidPwd8Bound() {
        // Given
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .oldPassword("OldPassw0rd")
                .newPassword("NewPass1")
                .confirmNewPassword("NewPass1")
                .build();

        // When
        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID22 - ChangePasswordRequest newPassword length = 7 -> ConstraintViolation")
    void utcid22_changePassword_invalidPwd7() {
        // Given
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .oldPassword("OldPassw0rd")
                .newPassword("NewPas1")
                .confirmNewPassword("NewPas1")
                .build();

        // When
        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Mật khẩu mới phải có độ dài từ 8 đến 100 ký tự");
    }

    @Test
    @DisplayName("UTCID23 - ResetPasswordRequest OTP length = 6 -> valid")
    void utcid23_resetPassword_invalidOtp6Bound() {
        // Given
        ResetPasswordRequest req = ResetPasswordRequest.builder()
                .email(EMAIL)
                .token("123456")
                .newPassword("NewPassw0rd1")
                .build();

        // When
        Set<ConstraintViolation<ResetPasswordRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID24 - ResetPasswordRequest OTP length = 5 -> ConstraintViolation")
    void utcid24_resetPassword_invalidOtp5() {
        // Given
        ResetPasswordRequest req = ResetPasswordRequest.builder()
                .email(EMAIL)
                .token("12345")
                .newPassword("NewPassw0rd1")
                .build();

        // When
        Set<ConstraintViolation<ResetPasswordRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Mã xác thực phải đúng 6 chữ số");
    }
}
