package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.user.UserProfileMapper;
import com.alumnect.alumnect_backend.service.user.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-05 View User Profile.
 * Report sheet : FE-05 (Report5_Unit_Test.xlsx)
 * Functions    : UserServiceImpl.getOwnProfile(), getUserProfile()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-05 View User Profile")
class FE05_ViewProfileTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock UserProfileMapper userProfileMapper;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock ExperienceRepository experienceRepository;
    @Mock MajorRepository majorRepository;
    @Mock UserSkillRepository userSkillRepository;
    @Mock FollowRepository followRepository;

    // ===== System under test =====
    private UserServiceImpl userService;

    // ===== Test data =====
    private static final String EMAIL = "student@fpt.edu.vn";
    private User activeUser;
    private UserProfile profile;

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

        profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();
        activeUser = User.builder()
                .id(1L)
                .email(EMAIL)
                .profile(profile)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ================= getOwnProfile() =================

    @Test
    @DisplayName("UTCID01 - Authenticated user with profile -> returns UserProfileResponse with counts")
    void utcid01_getOwnProfile_ok() {
        // Given
        UserProfileResponse res = new UserProfileResponse();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));
        when(userProfileMapper.toResponse(profile)).thenReturn(res);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());
        when(followRepository.countByFollowingId(1L)).thenReturn(7L);
        when(followRepository.countByFollowerId(1L)).thenReturn(3L);

        // When
        UserProfileResponse result = userService.getOwnProfile(EMAIL);

        // Then
        assertThat(result.getFollowersCount()).isEqualTo(7L);
        assertThat(result.getFollowingCount()).isEqualTo(3L);
        assertThat(result.getIsFollowing()).isFalse();
    }

    @Test
    @DisplayName("UTCID02 - No account exists for email -> ResourceNotFoundException")
    void utcid02_getOwnProfile_notFoundEmail() {
        // Given
        when(userRepository.findByEmail("unknown@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> userService.getOwnProfile("unknown@fpt.edu.vn"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng với email: unknown@fpt.edu.vn");

        verify(userProfileMapper, never()).toResponse(any());
    }

    @Test
    @DisplayName("UTCID03 - Account exists but profile is null -> ResourceNotFoundException")
    void utcid03_getOwnProfile_notFoundProfile() {
        // Given
        activeUser.setProfile(null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeUser));

        // When + Then
        assertThatThrownBy(() -> userService.getOwnProfile(EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy hồ sơ cá nhân cho tài khoản: " + EMAIL);

        verify(userProfileMapper, never()).toResponse(any());
    }

    // ================= getUserProfile() =================

    @Test
    @DisplayName("UTCID04 - Target ACTIVE & viewer anonymous -> returns UserProfileResponse with isFollowing=false")
    void utcid04_getUserProfile_okAnonymous() {
        // Given
        UserProfile targetProfile = UserProfile.builder().userId(10L).fullName("Tran Van B").build();
        User targetUser = User.builder().id(10L).accountStatus(AccountStatus.ACTIVE).profile(targetProfile).build();

        UserProfileResponse res = new UserProfileResponse();
        when(userRepository.findById(10L)).thenReturn(Optional.of(targetUser));
        when(userProfileMapper.toResponse(targetProfile)).thenReturn(res);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(10L)).thenReturn(Optional.empty());
        when(followRepository.countByFollowingId(10L)).thenReturn(15L);
        when(followRepository.countByFollowerId(10L)).thenReturn(5L);

        // When
        UserProfileResponse result = userService.getUserProfile(10L);

        // Then
        assertThat(result.getFollowersCount()).isEqualTo(15L);
        assertThat(result.getFollowingCount()).isEqualTo(5L);
        assertThat(result.getIsFollowing()).isFalse();
    }

    @Test
    @DisplayName("UTCID05 - Target ACTIVE & logged-in viewer follows target -> returns isFollowing=true")
    void utcid05_getUserProfile_okFollowing() {
        // Given
        String viewerEmail = "viewer@fpt.edu.vn";
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(viewerEmail, null, Collections.emptyList()));

        User viewer = User.builder().id(2L).email(viewerEmail).build();
        UserProfile targetProfile = UserProfile.builder().userId(10L).fullName("Tran Van B").build();
        User targetUser = User.builder().id(10L).accountStatus(AccountStatus.ACTIVE).profile(targetProfile).build();

        UserProfileResponse res = new UserProfileResponse();
        when(userRepository.findById(10L)).thenReturn(Optional.of(targetUser));
        when(userProfileMapper.toResponse(targetProfile)).thenReturn(res);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(10L)).thenReturn(Optional.empty());
        when(followRepository.countByFollowingId(10L)).thenReturn(10L);
        when(followRepository.countByFollowerId(10L)).thenReturn(4L);
        when(userRepository.findByEmail(viewerEmail)).thenReturn(Optional.of(viewer));
        when(followRepository.existsByFollowerIdAndFollowingId(2L, 10L)).thenReturn(true);

        // When
        UserProfileResponse result = userService.getUserProfile(10L);

        // Then
        assertThat(result.getIsFollowing()).isTrue();
    }

    @Test
    @DisplayName("UTCID06 - Target user is LOCKED -> BadRequestException")
    void utcid06_getUserProfile_badRequestLocked() {
        // Given
        UserProfile targetProfile = UserProfile.builder().userId(10L).fullName("Tran Van B").build();
        User targetUser = User.builder().id(10L).accountStatus(AccountStatus.LOCKED).profile(targetProfile).build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(targetUser));

        // When + Then
        assertThatThrownBy(() -> userService.getUserProfile(10L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản người dùng này chưa được kích hoạt hoặc đã bị khóa.");

        verify(followRepository, never()).countByFollowingId(anyLong());
    }

    @Test
    @DisplayName("UTCID07 - Target user ID 999 does not exist -> ResourceNotFoundException")
    void utcid07_getUserProfile_notFoundUser() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> userService.getUserProfile(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng với ID: 999");

        verify(userProfileMapper, never()).toResponse(any());
    }
}
