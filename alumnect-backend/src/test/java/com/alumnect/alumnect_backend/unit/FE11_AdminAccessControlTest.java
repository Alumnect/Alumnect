package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.security.Endpoints;
import com.alumnect.alumnect_backend.security.filter.JwtFilter;
import com.alumnect.alumnect_backend.security.jwt.JwtService;
import com.alumnect.alumnect_backend.security.principal.UserDetailServiceImpl;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.Date;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-11 Admin Console Shell, Access Control & Navigation.
 * Report sheet : FE-11 (Report5_Unit_Test.xlsx)
 * Functions    : JwtService.generateToken(), generateRefreshToken(), validateToken(), JwtFilter.doFilterInternal(), UserDetailServiceImpl.loadUserByUsername()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-11 Admin Console Shell, Access Control & Navigation")
class FE11_AdminAccessControlTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock UserDetailServiceImpl mockUserDetailsService;
    @Mock JwtService mockJwtService;
    @Mock HttpServletRequest request;
    @Mock HttpServletResponse response;
    @Mock FilterChain filterChain;

    // ===== System under test =====
    private JwtService jwtService;
    private UserDetailServiceImpl userDetailService;

    @InjectMocks
    private JwtFilter jwtFilter;

    // ===== Test data =====
    private static final String SECRET_KEY = "MTIzNDU2NDU5OThEMzIxM0F6eGMzNTE2NTQzMjEzMjE2NTQ5OHEzMTNhMnMxZDMyMnp4M2MyMQ==";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private User adminUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "keySecret", SECRET_KEY);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L); // 24h
        ReflectionTestUtils.setField(jwtService, "jwtRefreshExpiration", 604800000L); // 7d

        userDetailService = new UserDetailServiceImpl();
        ReflectionTestUtils.setField(userDetailService, "userRepository", userRepository);

        Role adminRole = Role.builder().id(3L).name("ADMIN").build();
        adminUser = User.builder()
                .id(1L)
                .email(ADMIN_EMAIL)
                .passwordHash("$2a$hash")
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .isAccountVerified(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ================= JwtService =================

    @Test
    @DisplayName("UTCID01 - generateToken(user) -> returns HS256 JWT with email, id, role=ADMIN, isAccountVerified=true")
    void utcid01_generateToken_ok() {
        // When
        String token = jwtService.generateToken(adminUser);

        // Then
        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo(ADMIN_EMAIL);
        Long id = jwtService.extractClaims(token, claims -> claims.get("id", Long.class));
        String role = jwtService.extractClaims(token, claims -> claims.get("role", String.class));
        Boolean isVerified = jwtService.extractClaims(token, claims -> claims.get("isAccountVerified", Boolean.class));
        assertThat(id).isEqualTo(1L);
        assertThat(role).isEqualTo("ADMIN");
        assertThat(isVerified).isTrue();
    }

    @Test
    @DisplayName("UTCID02 - Access token lifetime equals 24 hours (within 1 second)")
    void utcid02_generateToken_okLifetime24h() {
        // When
        String token = jwtService.generateToken(adminUser);

        // Then
        Date exp = jwtService.extractExpiration(token);
        long diff = exp.getTime() - System.currentTimeMillis();
        assertThat(Math.abs(diff - 86400000L)).isLessThan(5000L);
    }

    @Test
    @DisplayName("UTCID03 - generateRefreshToken(user) -> valid 7 days, carries role but no isAccountVerified")
    void utcid03_generateRefreshToken_ok() {
        // When
        String token = jwtService.generateRefreshToken(adminUser);

        // Then
        assertThat(jwtService.extractUsername(token)).isEqualTo(ADMIN_EMAIL);
        Date exp = jwtService.extractExpiration(token);
        long diff = exp.getTime() - System.currentTimeMillis();
        assertThat(Math.abs(diff - 604800000L)).isLessThan(5000L);

        String role = jwtService.extractClaims(token, claims -> claims.get("role", String.class));
        assertThat(role).isEqualTo("ADMIN");
        Object isVerified = jwtService.extractClaims(token, claims -> claims.get("isAccountVerified"));
        assertThat(isVerified).isNull();
    }

    @Test
    @DisplayName("UTCID04 - Fresh token matching UserDetails -> validateToken returns true")
    void utcid04_validateToken_ok() {
        // Given
        String token = jwtService.generateToken(adminUser);
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(ADMIN_EMAIL).password("pwd").roles("ADMIN").build();

        // When
        Boolean valid = jwtService.validateToken(token, userDetails);

        // Then
        assertThat(valid).isTrue();
    }

    @Test
    @DisplayName("UTCID05 - Token subject does not match UserDetails -> validateToken returns false")
    void utcid05_validateToken_badRequestMismatch() {
        // Given
        String token = jwtService.generateToken(adminUser);
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("other@fpt.edu.vn").password("pwd").roles("ADMIN").build();

        // When
        Boolean valid = jwtService.validateToken(token, userDetails);

        // Then
        assertThat(valid).isFalse();
    }

    @Test
    @DisplayName("UTCID06 - Expired token -> ExpiredJwtException")
    void utcid06_extractUsername_exceptionExpired() {
        // Given
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -10000L);
        String expiredToken = jwtService.generateToken(adminUser);

        // When + Then
        assertThatThrownBy(() -> jwtService.extractUsername(expiredToken))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("UTCID07 - Tampered token -> JwtException")
    void utcid07_extractUsername_exceptionTampered() {
        // Given
        String token = jwtService.generateToken(adminUser);
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        // When + Then
        assertThatThrownBy(() -> jwtService.extractUsername(tamperedToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("UTCID08 - Non-JWT string -> MalformedJwtException")
    void utcid08_extractUsername_exceptionMalformed() {
        // When + Then
        assertThatThrownBy(() -> jwtService.extractUsername("not-a-jwt"))
                .isInstanceOf(MalformedJwtException.class);
    }

    // ================= JwtFilter =================

    @Test
    @DisplayName("UTCID09 - Authorization Bearer valid token -> SecurityContext authenticated, chain continues")
    void utcid09_doFilterInternal_ok() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-admin-token");
        when(mockJwtService.extractUsername("valid-admin-token")).thenReturn(ADMIN_EMAIL);
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(ADMIN_EMAIL).password("pwd").roles("ADMIN").build();
        when(mockUserDetailsService.loadUserByUsername(ADMIN_EMAIL)).thenReturn(userDetails);
        when(mockJwtService.validateToken("valid-admin-token", userDetails)).thenReturn(true);

        // When
        jwtFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(ADMIN_EMAIL);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting(Object::toString).contains("ROLE_ADMIN");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("UTCID10 - No Authorization header -> No authentication, chain continues")
    void utcid10_doFilterInternal_okGuest() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);

        // When
        jwtFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(mockJwtService, never()).extractUsername(anyString());
    }

    @Test
    @DisplayName("UTCID11 - Authorization header Basic -> ignored, JwtService never called")
    void utcid11_doFilterInternal_badRequestOtherScheme() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Basic abcdef");

        // When
        jwtFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(mockJwtService, never()).extractUsername(anyString());
    }

    @Test
    @DisplayName("UTCID12 - Bearer token garbage -> exception swallowed, chain continues")
    void utcid12_doFilterInternal_badRequestGarbageToken() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer garbage");
        when(mockJwtService.extractUsername("garbage")).thenThrow(new MalformedJwtException("Malformed"));

        // When
        jwtFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("UTCID13 - User not found in DB -> exception swallowed, chain continues")
    void utcid13_doFilterInternal_notFoundUser() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(mockJwtService.extractUsername("valid-token")).thenReturn("ghost@fpt.edu.vn");
        when(mockUserDetailsService.loadUserByUsername("ghost@fpt.edu.vn"))
                .thenThrow(new UsernameNotFoundException("User not found"));

        // When
        jwtFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("UTCID14 - validateToken returns false -> No authentication in SecurityContext")
    void utcid14_doFilterInternal_badRequestInvalidToken() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        when(mockJwtService.extractUsername("tok")).thenReturn(ADMIN_EMAIL);
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(ADMIN_EMAIL).password("pwd").roles("ADMIN").build();
        when(mockUserDetailsService.loadUserByUsername(ADMIN_EMAIL)).thenReturn(userDetails);
        when(mockJwtService.validateToken("tok", userDetails)).thenReturn(false);

        // When
        jwtFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    // ================= UserDetailServiceImpl =================

    @Test
    @DisplayName("UTCID15 - ACTIVE, email-verified ADMIN -> UserDetails: ROLE_ADMIN, enabled=true, accountNonLocked=true")
    void utcid15_loadUserByUsername_ok() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When
        UserDetails details = userDetailService.loadUserByUsername(ADMIN_EMAIL);

        // Then
        assertThat(details.getUsername()).isEqualTo(ADMIN_EMAIL);
        assertThat(details.isEnabled()).isTrue();
        assertThat(details.isAccountNonLocked()).isTrue();
        assertThat(details.getAuthorities()).extracting(Object::toString).contains("ROLE_ADMIN");
    }

    @Test
    @DisplayName("UTCID16 - Role name already has ROLE_ prefix -> prefix is not duplicated")
    void utcid16_loadUserByUsername_okPrefixNotDuplicated() {
        // Given
        Role role = Role.builder().name("ROLE_ADMIN").build();
        adminUser.setRole(role);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When
        UserDetails details = userDetailService.loadUserByUsername(ADMIN_EMAIL);

        // Then
        assertThat(details.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_ADMIN");
    }

    @Test
    @DisplayName("UTCID17 - Account status LOCKED -> accountNonLocked = false and enabled = false")
    void utcid17_loadUserByUsername_badRequestLocked() {
        // Given
        adminUser.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When
        UserDetails details = userDetailService.loadUserByUsername(ADMIN_EMAIL);

        // Then
        assertThat(details.isAccountNonLocked()).isFalse();
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("UTCID18 - Email not verified -> enabled = false")
    void utcid18_loadUserByUsername_badRequestUnverified() {
        // Given
        adminUser.setEmailVerified(false);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When
        UserDetails details = userDetailService.loadUserByUsername(ADMIN_EMAIL);

        // Then
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("UTCID19 - No account for email -> UsernameNotFoundException")
    void utcid19_loadUserByUsername_notFound() {
        // Given
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> userDetailService.loadUserByUsername("ghost@fpt.edu.vn"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với email: ghost@fpt.edu.vn");
    }

    @Test
    @DisplayName("UTCID20 - Google account (passwordHash null) -> UserDetails with empty password ''")
    void utcid20_loadUserByUsername_okNullPassword() {
        // Given
        adminUser.setPasswordHash(null);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When
        UserDetails details = userDetailService.loadUserByUsername(ADMIN_EMAIL);

        // Then
        assertThat(details.getPassword()).isEqualTo("");
    }

    // ================= Endpoints Constants =================

    @Test
    @DisplayName("UTCID21 - Endpoints.ADMIN_ENDPOINT contains '/api/v1/admin/**'")
    void utcid21_endpoints_okAdminEndpoint() {
        // Then
        assertThat(Endpoints.ADMIN_ENDPOINT).contains("/api/v1/admin/**");
    }

    @Test
    @DisplayName("UTCID22 - Endpoints.PUBLIC_POST contains auth routes and no admin route")
    void utcid22_endpoints_okPublicPost() {
        // Then
        assertThat(Endpoints.PUBLIC_POST).contains(
                "/api/v1/auth/login",
                "/api/v1/auth/register",
                "/api/v1/auth/refresh",
                "/api/v1/auth/forgot-password"
        );
        assertThat(Arrays.stream(Endpoints.PUBLIC_POST).noneMatch(ep -> ep.startsWith("/api/v1/admin"))).isTrue();
    }
}
