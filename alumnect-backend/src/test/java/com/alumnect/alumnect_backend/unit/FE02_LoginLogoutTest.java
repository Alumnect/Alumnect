package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.auth.RefreshTokenRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.auth.LoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.LogoutRequest;
import com.alumnect.alumnect_backend.dto.request.auth.RefreshRequest;
import com.alumnect.alumnect_backend.dto.response.auth.LoginResponse;
import com.alumnect.alumnect_backend.entity.auth.RefreshToken;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.security.jwt.JwtService;
import com.alumnect.alumnect_backend.service.auth.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-02 Sign In & Logout (Email & Password).
 * Report sheet : FE-02 (Report5_Unit_Test.xlsx)
 * Functions    : AuthServiceImpl.login(), refresh(), logout(), logoutAllDevices()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-02 Sign In & Logout (Email & Password)")
class FE02_LoginLogoutTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;

    // ===== System under test =====
    @InjectMocks AuthServiceImpl authService;

    // ===== Test data =====
    private static final String EMAIL = "student@fpt.edu.vn";
    private static final String PASSWORD = "Passw0rd1";
    private static final String USER_AGENT = "Mozilla/5.0";
    private static final String IP_ADDRESS = "127.0.0.1";
    private static final String RAW_REFRESH_TOKEN = "raw-refresh-jwt-token";

    private User activeUser;
    private Role studentRole;
    private LoginRequest loginRequest;

    private static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @BeforeEach
    void setUp() {
        studentRole = Role.builder().id(1L).name("STUDENT").build();
        activeUser = User.builder()
                .id(1L)
                .email(EMAIL)
                .passwordHash("$2a$hashed")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        loginRequest = LoginRequest.builder()
                .email(EMAIL)
                .password(PASSWORD)
                .build();
    }

    // ================= login() =================

    @Test
    @DisplayName("UTCID01 - Valid credentials & ACTIVE account -> returns LoginResponse, RefreshToken saved")
    void utcid01_login_ok() {
        // Given
        UserProfile profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").avatarUrl("http://cdn/a.png").build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(PASSWORD, "$2a$hashed")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(activeUser);
        when(jwtService.generateToken(activeUser)).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(activeUser)).thenReturn(RAW_REFRESH_TOKEN);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));

        // When
        LoginResponse response = authService.login(loginRequest, USER_AGENT, IP_ADDRESS);

        // Then
        assertThat(response.getAccessToken()).isEqualTo("access-token-123");
        assertThat(response.getRefreshToken()).isEqualTo(RAW_REFRESH_TOKEN);
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo(EMAIL);
        assertThat(response.getRole()).isEqualTo("STUDENT");
        assertThat(response.getFullName()).isEqualTo("Nguyen Van A");
        assertThat(response.getAccountStatus()).isEqualTo("ACTIVE");

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken savedToken = captor.getValue();
        assertThat(savedToken.getUser()).isEqualTo(activeUser);
        assertThat(savedToken.getTokenHash()).isEqualTo(hashToken(RAW_REFRESH_TOKEN));
        assertThat(savedToken.isRevoked()).isFalse();
        assertThat(savedToken.getUserAgent()).isEqualTo(USER_AGENT);
        assertThat(savedToken.getIpAddress()).isEqualTo(IP_ADDRESS);
    }

    @Test
    @DisplayName("UTCID02 - Unknown email -> BadRequestException")
    void utcid02_login_badRequestUnknownEmail() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.login(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản hoặc mật khẩu không chính xác");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID03 - Wrong password -> BadRequestException")
    void utcid03_login_badRequestWrongPassword() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(PASSWORD, "$2a$hashed")).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> authService.login(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản hoặc mật khẩu không chính xác");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID04 - Account LOCKED -> BadRequestException")
    void utcid04_login_badRequestLocked() {
        // Given
        activeUser.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(PASSWORD, "$2a$hashed")).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> authService.login(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Account WAITING_APPROVAL -> BadRequestException")
    void utcid05_login_badRequestWaitingApproval() {
        // Given
        activeUser.setAccountStatus(AccountStatus.WAITING_APPROVAL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(PASSWORD, "$2a$hashed")).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> authService.login(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng đợi.");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - Email not verified -> BadRequestException")
    void utcid06_login_badRequestUnverifiedEmail() {
        // Given
        activeUser.setEmailVerified(false);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(PASSWORD, "$2a$hashed")).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> authService.login(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email của bạn chưa được xác thực. Vui lòng kiểm tra hòm thư để xác thực trước.");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Social account (passwordHash null) -> BadRequestException")
    void utcid07_login_badRequestSocialAccount() {
        // Given
        activeUser.setPasswordHash(null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When + Then
        assertThatThrownBy(() -> authService.login(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản này được đăng ký thông qua mạng xã hội khác");

        verify(passwordEncoder, never()).matches(any(), any());
    }

    // ================= refresh() =================

    @Test
    @DisplayName("UTCID08 - Valid refresh token -> returns new tokens, old revoked")
    void utcid08_refresh_ok() {
        // Given
        RefreshRequest request = new RefreshRequest(RAW_REFRESH_TOKEN);
        String tokenHash = hashToken(RAW_REFRESH_TOKEN);
        RefreshToken storedToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .user(activeUser)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        UserProfile profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();

        when(jwtService.extractUsername(RAW_REFRESH_TOKEN)).thenReturn(EMAIL);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(storedToken));
        when(jwtService.generateToken(activeUser)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(activeUser)).thenReturn("new-raw-refresh-token");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));

        // When
        LoginResponse response = authService.refresh(request, USER_AGENT, IP_ADDRESS);

        // Then
        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("new-raw-refresh-token");
        assertThat(storedToken.isRevoked()).isTrue();
        verify(refreshTokenRepository, org.mockito.Mockito.times(2)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("UTCID09 - Tampered/invalid JWT -> BadRequestException")
    void utcid09_refresh_badRequestMalformedJwt() {
        // Given
        RefreshRequest request = new RefreshRequest("garbage-token");
        when(jwtService.extractUsername("garbage-token")).thenThrow(new RuntimeException("JWT invalid"));

        // When + Then
        assertThatThrownBy(() -> authService.refresh(request, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.");

        verify(refreshTokenRepository, never()).findByTokenHash(any());
    }

    @Test
    @DisplayName("UTCID10 - Replay attack (token revoked) -> BadRequestException & all tokens deleted")
    void utcid10_refresh_badRequestReplayAttack() {
        // Given
        RefreshRequest request = new RefreshRequest(RAW_REFRESH_TOKEN);
        String tokenHash = hashToken(RAW_REFRESH_TOKEN);
        RefreshToken revokedToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .user(activeUser)
                .expiresAt(Instant.now().plus(5, ChronoUnit.DAYS))
                .revoked(true)
                .build();

        when(jwtService.extractUsername(RAW_REFRESH_TOKEN)).thenReturn(EMAIL);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(revokedToken));

        // When + Then
        assertThatThrownBy(() -> authService.refresh(request, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.");

        verify(refreshTokenRepository).deleteByUser(activeUser);
    }

    @Test
    @DisplayName("UTCID11 - Expired refresh token -> BadRequestException")
    void utcid11_refresh_badRequestExpired() {
        // Given
        RefreshRequest request = new RefreshRequest(RAW_REFRESH_TOKEN);
        String tokenHash = hashToken(RAW_REFRESH_TOKEN);
        RefreshToken expiredToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .user(activeUser)
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .revoked(false)
                .build();

        when(jwtService.extractUsername(RAW_REFRESH_TOKEN)).thenReturn(EMAIL);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(expiredToken));

        // When + Then
        assertThatThrownBy(() -> authService.refresh(request, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.");
    }

    // ================= logout() =================

    @Test
    @DisplayName("UTCID12 - Logout success -> refresh token deleted")
    void utcid12_logout_ok() {
        // Given
        LogoutRequest request = new LogoutRequest(RAW_REFRESH_TOKEN);
        String tokenHash = hashToken(RAW_REFRESH_TOKEN);
        RefreshToken token = RefreshToken.builder().tokenHash(tokenHash).build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        // When
        authService.logout(request);

        // Then
        verify(refreshTokenRepository).delete(token);
    }

    @Test
    @DisplayName("UTCID13 - Logout unknown token -> BadRequestException")
    void utcid13_logout_badRequestUnknownToken() {
        // Given
        LogoutRequest request = new LogoutRequest(RAW_REFRESH_TOKEN);
        String tokenHash = hashToken(RAW_REFRESH_TOKEN);

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.logout(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiên đăng nhập không tồn tại hoặc đã hết hạn.");

        verify(refreshTokenRepository, never()).delete(any());
    }

    // ================= logoutAllDevices() =================

    @Test
    @DisplayName("UTCID14 - Logout all devices -> all user refresh tokens deleted")
    void utcid14_logoutAllDevices_ok() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When
        authService.logoutAllDevices(EMAIL);

        // Then
        verify(refreshTokenRepository).deleteByUser(activeUser);
    }
}
