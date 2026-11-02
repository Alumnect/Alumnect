package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AuthProvider;
import com.alumnect.alumnect_backend.dao.auth.RefreshTokenRepository;
import com.alumnect.alumnect_backend.dao.auth.UserOAuthProviderRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.RoleRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSettingsRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleLoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleRegisterRequest;
import com.alumnect.alumnect_backend.dto.response.auth.LoginResponse;
import com.alumnect.alumnect_backend.entity.auth.RefreshToken;
import com.alumnect.alumnect_backend.entity.auth.UserOAuthProvider;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.GoogleUserNotFoundException;
import com.alumnect.alumnect_backend.security.jwt.JwtService;
import com.alumnect.alumnect_backend.service.auth.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-03 Sign In with Google (OAuth).
 * Report sheet : FE-03 (Report5_Unit_Test.xlsx)
 * Functions    : AuthServiceImpl.loginWithGoogle(), registerWithGoogle()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-03 Sign In with Google (OAuth)")
class FE03_GoogleAuthTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock MajorRepository majorRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock UserSettingsRepository userSettingsRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock UserOAuthProviderRepository userOAuthProviderRepository;
    @Mock VerificationRequestRepository verificationRequestRepository;
    @Mock JwtService jwtService;
    @Mock RestTemplate restTemplate;

    // ===== System under test =====
    @InjectMocks AuthServiceImpl authService;

    // ===== Test data =====
    private static final String CLIENT_ID = "google-client-id-123";
    private static final String GOOGLE_TOKEN = "valid-google-id-token";
    private static final String EMAIL = "student@fpt.edu.vn";
    private static final String SUB = "google-sub-001";
    private static final String USER_AGENT = "Mozilla/5.0";
    private static final String IP_ADDRESS = "127.0.0.1";

    private GoogleLoginRequest loginRequest;
    private GoogleRegisterRequest registerRequest;
    private User activeUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "googleClientId", CLIENT_ID);

        loginRequest = new GoogleLoginRequest(GOOGLE_TOKEN);

        registerRequest = GoogleRegisterRequest.builder()
                .token(GOOGLE_TOKEN)
                .fullName("Nguyen Van A")
                .role("STUDENT")
                .majorId(1L)
                .studentCode("DE180001")
                .build();

        Role role = Role.builder().id(1L).name("STUDENT").build();
        activeUser = User.builder()
                .id(1L)
                .email(EMAIL)
                .role(role)
                .accountStatus(AccountStatus.ACTIVE)
                .authProvider(AuthProvider.GOOGLE)
                .emailVerified(true)
                .build();
    }

    private Map<String, Object> createValidClaims(String aud, boolean emailVerified) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", SUB);
        claims.put("email", EMAIL);
        claims.put("name", "Nguyen Van A");
        claims.put("aud", aud);
        claims.put("email_verified", emailVerified);
        claims.put("picture", "https://cdn/pic.png");
        return claims;
    }

    // ================= loginWithGoogle() =================

    @Test
    @DisplayName("UTCID01 - Valid Google token & linked ACTIVE user -> returns LoginResponse, lastLoginAt updated")
    void utcid01_loginWithGoogle_ok() {
        // Given
        Map<String, Object> claims = createValidClaims(CLIENT_ID, true);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        UserOAuthProvider oauth = UserOAuthProvider.builder().user(activeUser).provider("GOOGLE").providerUserId(SUB).build();
        when(userOAuthProviderRepository.findByProviderAndProviderUserId("GOOGLE", SUB)).thenReturn(Optional.of(oauth));
        when(userRepository.save(any(User.class))).thenReturn(activeUser);
        when(jwtService.generateToken(activeUser)).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(activeUser)).thenReturn("refresh-token-123");
        UserProfile profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").avatarUrl("https://cdn/pic.png").build();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));

        // When
        LoginResponse response = authService.loginWithGoogle(loginRequest, USER_AGENT, IP_ADDRESS);

        // Then
        assertThat(response.getAccessToken()).isEqualTo("access-token-123");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token-123");
        assertThat(response.getEmail()).isEqualTo(EMAIL);
        assertThat(response.getRole()).isEqualTo("STUDENT");
        assertThat(response.getFullName()).isEqualTo("Nguyen Van A");
        verify(userRepository).save(activeUser);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("UTCID02 - Google account not linked and email not registered -> GoogleUserNotFoundException")
    void utcid02_loginWithGoogle_notFoundUser() {
        // Given
        Map<String, Object> claims = createValidClaims(CLIENT_ID, true);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        when(userOAuthProviderRepository.findByProviderAndProviderUserId("GOOGLE", SUB)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> authService.loginWithGoogle(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(GoogleUserNotFoundException.class)
                .hasMessage("Tài khoản Google chưa được đăng ký trên hệ thống.")
                .satisfies(ex -> {
                    GoogleUserNotFoundException gunfe = (GoogleUserNotFoundException) ex;
                    assertThat(gunfe.getEmail()).isEqualTo(EMAIL);
                    assertThat(gunfe.getFullName()).isEqualTo("Nguyen Van A");
                    assertThat(gunfe.getProviderUserId()).isEqualTo(SUB);
                });

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID03 - Google token aud mismatch -> BadRequestException")
    void utcid03_loginWithGoogle_badRequestAudienceMismatch() {
        // Given
        Map<String, Object> claims = createValidClaims("wrong-client-id", true);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        // When + Then
        assertThatThrownBy(() -> authService.loginWithGoogle(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Token xác thực Google không khớp với Client ID của hệ thống");

        verify(userOAuthProviderRepository, never()).findByProviderAndProviderUserId(anyString(), anyString());
    }

    @Test
    @DisplayName("UTCID04 - Google email_verified = false -> BadRequestException")
    void utcid04_loginWithGoogle_badRequestUnverifiedEmail() {
        // Given
        Map<String, Object> claims = createValidClaims(CLIENT_ID, false);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        // When + Then
        assertThatThrownBy(() -> authService.loginWithGoogle(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản Google này chưa được xác thực email");

        verify(userOAuthProviderRepository, never()).findByProviderAndProviderUserId(anyString(), anyString());
    }

    @Test
    @DisplayName("UTCID05 - Google tokeninfo call fails -> BadRequestException")
    void utcid05_loginWithGoogle_badRequestTokenInfoError() {
        // Given
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));

        // When + Then
        assertThatThrownBy(() -> authService.loginWithGoogle(loginRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Không thể xác thực tài khoản Google vào lúc này. Vui lòng thử lại sau.");

        verify(userOAuthProviderRepository, never()).findByProviderAndProviderUserId(anyString(), anyString());
    }

    // ================= registerWithGoogle() =================

    @Test
    @DisplayName("UTCID06 - Register STUDENT with Google -> ACTIVE account, OAuth saved, tokens returned")
    void utcid06_registerWithGoogle_okStudent() {
        // Given
        Map<String, Object> claims = createValidClaims(CLIENT_ID, true);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userOAuthProviderRepository.existsByProviderAndProviderUserId("GOOGLE", SUB)).thenReturn(false);
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(studentRole));
        Major major = Major.builder().id(1L).build();
        when(majorRepository.findById(1L)).thenReturn(Optional.of(major));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refresh-token-123");

        // When
        LoginResponse response = authService.registerWithGoogle(registerRequest, USER_AGENT, IP_ADDRESS);

        // Then
        assertThat(response.getAccessToken()).isEqualTo("access-token-123");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token-123");
        assertThat(response.getAccountStatus()).isEqualTo("ACTIVE");
        assertThat(response.getEmail()).isEqualTo(EMAIL);
        assertThat(response.getRole()).isEqualTo("STUDENT");

        verify(userOAuthProviderRepository).save(any(UserOAuthProvider.class));
        verify(userProfileRepository).save(any(UserProfile.class));
        verify(userSettingsRepository).save(any());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("UTCID07 - Register ALUMNI with Google & proofUrl -> WAITING_APPROVAL, no tokens, VerificationRequest saved")
    void utcid07_registerWithGoogle_okAlumni() {
        // Given
        registerRequest.setRole("ALUMNI");
        registerRequest.setProofUrl("https://cdn/proof.png");

        Map<String, Object> claims = createValidClaims(CLIENT_ID, true);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userOAuthProviderRepository.existsByProviderAndProviderUserId("GOOGLE", SUB)).thenReturn(false);
        when(userProfileRepository.existsByStudentCodeIgnoreCase("DE180001")).thenReturn(false);
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        when(roleRepository.findByName("ALUMNI")).thenReturn(Optional.of(alumniRole));
        Major major = Major.builder().id(1L).build();
        when(majorRepository.findById(1L)).thenReturn(Optional.of(major));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(verificationRequestRepository.findByUser(any(User.class))).thenReturn(Optional.empty());

        // When
        LoginResponse response = authService.registerWithGoogle(registerRequest, USER_AGENT, IP_ADDRESS);

        // Then
        assertThat(response.getAccessToken()).isNull();
        assertThat(response.getRefreshToken()).isNull();
        assertThat(response.getAccountStatus()).isEqualTo("WAITING_APPROVAL");

        verify(verificationRequestRepository).save(any(VerificationRequest.class));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - Register with Google when email ACTIVE -> ConflictException")
    void utcid08_registerWithGoogle_conflictActive() {
        // Given
        Map<String, Object> claims = createValidClaims(CLIENT_ID, true);
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(claims, HttpStatus.OK));

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When + Then
        assertThatThrownBy(() -> authService.registerWithGoogle(registerRequest, USER_AGENT, IP_ADDRESS))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email này đã được đăng ký và kích hoạt thành công. Vui lòng đăng nhập.");

        verify(userOAuthProviderRepository, never()).save(any());
    }
}
