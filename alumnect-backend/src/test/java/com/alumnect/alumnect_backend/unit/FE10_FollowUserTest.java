package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.user.FollowUserResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Follow;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.service.user.FollowServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-10 Manage Social Connections (Follow / Followers / Following).
 * Report sheet : FE-10 (Report5_Unit_Test.xlsx)
 * Functions    : FollowServiceImpl.followUser(), unfollowUser(), getFollowers(), getFollowing()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-10 Manage Social Connections")
class FE10_FollowUserTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock FollowRepository followRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock ExperienceRepository experienceRepository;
    @Mock NotificationService notificationService;

    // ===== System under test =====
    @InjectMocks FollowServiceImpl followService;

    // ===== Test data =====
    private static final String FOLLOWER_EMAIL = "me@fpt.edu.vn";
    private User follower;
    private User following;

    @BeforeEach
    void setUp() {
        follower = User.builder().id(1L).email(FOLLOWER_EMAIL).accountStatus(AccountStatus.ACTIVE).build();
        following = User.builder().id(2L).email("target@fpt.edu.vn").accountStatus(AccountStatus.ACTIVE).build();
    }

    // ================= followUser() =================

    @Test
    @DisplayName("UTCID01 - Both accounts ACTIVE & not following -> Follow saved, notification sent")
    void utcid01_followUser_ok() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);

        // When
        followService.followUser(FOLLOWER_EMAIL, 2L);

        // Then
        verify(followRepository).saveAndFlush(any(Follow.class));
        verify(notificationService).sendFollowNotification(follower, following);
    }

    @Test
    @DisplayName("UTCID02 - Follower email does not exist -> ResourceNotFoundException")
    void utcid02_followUser_notFoundFollower() {
        // Given
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> followService.followUser("ghost@fpt.edu.vn", 2L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người thực hiện theo dõi.");

        verify(followRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("UTCID03 - Target user id 404 does not exist -> ResourceNotFoundException")
    void utcid03_followUser_notFoundTarget() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> followService.followUser(FOLLOWER_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng cần theo dõi.");

        verify(followRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("UTCID04 - Self follow (id=1 following id=1) -> BadRequestException")
    void utcid04_followUser_badRequestSelfFollow() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(1L)).thenReturn(Optional.of(follower));

        // When + Then
        assertThatThrownBy(() -> followService.followUser(FOLLOWER_EMAIL, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn không thể tự theo dõi chính mình.");

        verify(followRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("UTCID05 - Follower account is LOCKED -> BadRequestException")
    void utcid05_followUser_badRequestFollowerLocked() {
        // Given
        follower.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));

        // When + Then
        assertThatThrownBy(() -> followService.followUser(FOLLOWER_EMAIL, 2L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa.");

        verify(followRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("UTCID06 - Target account is LOCKED -> BadRequestException")
    void utcid06_followUser_badRequestTargetLocked() {
        // Given
        following.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));

        // When + Then
        assertThatThrownBy(() -> followService.followUser(FOLLOWER_EMAIL, 2L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tài khoản người dùng cần theo dõi chưa được kích hoạt hoặc đã bị khóa.");

        verify(followRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("UTCID07 - Follow relation already exists -> ConflictException")
    void utcid07_followUser_conflictAlreadyFollowed() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);

        // When + Then
        assertThatThrownBy(() -> followService.followUser(FOLLOWER_EMAIL, 2L))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã theo dõi người dùng này từ trước.");

        verify(followRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("UTCID08 - Concurrent duplicate follow -> DataIntegrityViolationException mapped to ConflictException")
    void utcid08_followUser_conflictDataIntegrityViolation() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
        when(followRepository.saveAndFlush(any(Follow.class)))
                .thenThrow(new DataIntegrityViolationException("Unique constraint violation"));

        // When + Then
        assertThatThrownBy(() -> followService.followUser(FOLLOWER_EMAIL, 2L))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã theo dõi người dùng này từ trước.");
    }

    // ================= unfollowUser() =================

    @Test
    @DisplayName("UTCID09 - Unfollow success -> Follow relation deleted")
    void utcid09_unfollowUser_ok() {
        // Given
        Follow follow = Follow.builder().follower(follower).following(following).build();
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.existsById(2L)).thenReturn(true);
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(follow));

        // When
        followService.unfollowUser(FOLLOWER_EMAIL, 2L);

        // Then
        verify(followRepository).delete(follow);
    }

    @Test
    @DisplayName("UTCID10 - Unfollow target user id 404 does not exist -> ResourceNotFoundException")
    void utcid10_unfollowUser_notFoundTarget() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.existsById(404L)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> followService.unfollowUser(FOLLOWER_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng cần hủy theo dõi.");

        verify(followRepository, never()).delete(any());
    }

    @Test
    @DisplayName("UTCID11 - Not currently following target -> BadRequestException")
    void utcid11_unfollowUser_badRequestNotFollowing() {
        // Given
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userRepository.existsById(2L)).thenReturn(true);
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> followService.unfollowUser(FOLLOWER_EMAIL, 2L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn chưa theo dõi người dùng này.");

        verify(followRepository, never()).delete(any());
    }

    // ================= getFollowers() =================

    @Test
    @DisplayName("UTCID12 - Target ACTIVE, follower has exp Dev @ FPT -> headline = 'Dev @ FPT', isFollowing = true")
    void utcid12_getFollowers_ok() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        User follower3 = User.builder().id(3L).email("follower3@fpt.edu.vn").accountStatus(AccountStatus.ACTIVE).build();
        UserProfile profile3 = UserProfile.builder().userId(3L).fullName("Follower Three").headline("").build();
        Follow f = Follow.builder().follower(follower3).following(following).build();
        Page<Follow> followsPage = new PageImpl<>(List.of(f), pageable, 1);

        Experience exp = Experience.builder().id(10L).user(follower3).title("Dev").company("FPT").isPrimary(true).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowingId(2L, pageable)).thenReturn(followsPage);
        when(userRepository.findByEmail(FOLLOWER_EMAIL)).thenReturn(Optional.of(follower));
        when(userProfileRepository.findAllById(List.of(3L))).thenReturn(List.of(profile3));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(3L))).thenReturn(List.of(exp));
        Follow viewerFollowsFollower3 = Follow.builder().follower(follower).following(follower3).build();
        when(followRepository.findByFollowerIdAndFollowingIdIn(1L, List.of(3L))).thenReturn(List.of(viewerFollowsFollower3));

        // When
        PageResponse<FollowUserResponse> response = followService.getFollowers(FOLLOWER_EMAIL, 2L, pageable);

        // Then
        assertThat(response.getContent()).hasSize(1);
        FollowUserResponse item = response.getContent().get(0);
        assertThat(item.getHeadline()).isEqualTo("Dev @ FPT");
        assertThat(item.getIsFollowing()).isTrue();
    }

    @Test
    @DisplayName("UTCID13 - Target user is LOCKED -> BadRequestException")
    void utcid13_getFollowers_badRequestLocked() {
        // Given
        following.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));

        // When + Then
        assertThatThrownBy(() -> followService.getFollowers(FOLLOWER_EMAIL, 2L, PageRequest.of(0, 10)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Người dùng này chưa được kích hoạt hoặc đã bị khóa.");

        verify(followRepository, never()).findByFollowingId(any(), any());
    }

    @Test
    @DisplayName("UTCID14 - User id 404 does not exist -> ResourceNotFoundException")
    void utcid14_getFollowers_notFoundUser() {
        // Given
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> followService.getFollowers(FOLLOWER_EMAIL, 404L, PageRequest.of(0, 10)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng.");

        verify(followRepository, never()).findByFollowingId(any(), any());
    }

    @Test
    @DisplayName("UTCID15 - Follower has no profile & no experience -> fallback defaults")
    void utcid15_getFollowers_okFallbackNoProfile() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        User follower3 = User.builder().id(3L).email("follower3@fpt.edu.vn").accountStatus(AccountStatus.ACTIVE).build();
        Follow f = Follow.builder().follower(follower3).following(following).build();
        Page<Follow> followsPage = new PageImpl<>(List.of(f), pageable, 1);

        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowingId(2L, pageable)).thenReturn(followsPage);
        when(userProfileRepository.findAllById(List.of(3L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(3L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdsSortedChronologically(List.of(3L))).thenReturn(Collections.emptyList());

        // When
        PageResponse<FollowUserResponse> response = followService.getFollowers(null, 2L, pageable);

        // Then
        FollowUserResponse item = response.getContent().get(0);
        assertThat(item.getFullName()).isEqualTo("Thành viên AlumNect");
        assertThat(item.getHeadline()).isEqualTo("Cựu sinh viên FPTU");
        assertThat(item.getIsFollowing()).isFalse();
    }

    @Test
    @DisplayName("UTCID16 - Follower has declared headline -> declared headline has priority over experience")
    void utcid16_getFollowers_okDeclaredHeadlinePriority() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        User follower3 = User.builder().id(3L).email("follower3@fpt.edu.vn").accountStatus(AccountStatus.ACTIVE).build();
        UserProfile profile3 = UserProfile.builder().userId(3L).fullName("Follower Three").headline("Backend Engineer").build();
        Follow f = Follow.builder().follower(follower3).following(following).build();
        Page<Follow> followsPage = new PageImpl<>(List.of(f), pageable, 1);

        Experience exp = Experience.builder().id(10L).user(follower3).title("Dev").company("FPT").isPrimary(true).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowingId(2L, pageable)).thenReturn(followsPage);
        when(userProfileRepository.findAllById(List.of(3L))).thenReturn(List.of(profile3));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(3L))).thenReturn(List.of(exp));

        // When
        PageResponse<FollowUserResponse> response = followService.getFollowers(null, 2L, pageable);

        // Then
        FollowUserResponse item = response.getContent().get(0);
        assertThat(item.getHeadline()).isEqualTo("Backend Engineer");
    }

    @Test
    @DisplayName("UTCID17 - Target user has no followers -> empty PageResponse")
    void utcid17_getFollowers_okEmpty() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Follow> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowingId(2L, pageable)).thenReturn(emptyPage);

        // When
        PageResponse<FollowUserResponse> response = followService.getFollowers(null, 2L, pageable);

        // Then
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
        assertThat(response.isLast()).isTrue();
    }
}
