package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.response.user.ConnectionSuggestionResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.mapper.user.UserProfileMapper;
import com.alumnect.alumnect_backend.service.user.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-09 View Connection Suggestions.
 * Report sheet : FE-09 (Report5_Unit_Test.xlsx)
 * Functions    : UserServiceImpl.getConnectionSuggestions()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-09 View Connection Suggestions")
class FE09_ConnectionSuggestionTest {

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
    private static final String VIEWER_EMAIL = "viewer@fpt.edu.vn";

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
    }

    // ================= getConnectionSuggestions() =================

    @Test
    @DisplayName("UTCID01 - Visitor not logged in -> 1 suggestion, matchScore = 74, badges: Dev @ FPT, Cựu sinh viên tiêu biểu")
    void utcid01_getConnectionSuggestions_okGuest() {
        // Given
        UserProfile candProfile = UserProfile.builder().userId(10L).fullName("Nguyen Candidate").build();
        User candidate = User.builder().id(10L).email("cand@fpt.edu.vn").isAccountVerified(true).profile(candProfile).build();

        Experience exp = Experience.builder().id(1L).user(candidate).title("Dev").company("FPT").isPrimary(true).build();

        when(userRepository.findGuestCandidates(any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(List.of(exp));

        List<Object[]> followersCount = new ArrayList<>();
        followersCount.add(new Object[]{10L, 4L});
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(followersCount);
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(null, 5);

        // Then
        assertThat(results).hasSize(1);
        ConnectionSuggestionResponse suggestion = results.get(0);
        assertThat(suggestion.getMatchScore()).isEqualTo(74); // 40 (experience) + 30 (verified) + 4 (followers)
        assertThat(suggestion.getReasonBadges()).contains("Dev @ FPT", "Cựu sinh viên tiêu biểu");
    }

    @Test
    @DisplayName("UTCID02 - Same major SE -> badge 'Cùng ngành SE' and score includes +30")
    void utcid02_getConnectionSuggestions_okSameMajor() {
        // Given
        Major seMajor = Major.builder().id(1L).code("SE").name("Software Engineering").build();
        UserProfile viewerProfile = UserProfile.builder().userId(99L).major(seMajor).build();
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).profile(viewerProfile).build();

        UserProfile candProfile = UserProfile.builder().userId(10L).major(seMajor).build();
        User candidate = User.builder().id(10L).profile(candProfile).build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getReasonBadges()).contains("Cùng ngành SE");
        assertThat(results.get(0).getMatchScore()).isGreaterThanOrEqualTo(30);
    }

    @Test
    @DisplayName("UTCID03 - Same cohort 2018 -> badge 'Cùng khóa K2018' and score +25")
    void utcid03_getConnectionSuggestions_okSameCohort() {
        // Given
        UserProfile viewerProfile = UserProfile.builder().userId(99L).cohort(2018).build();
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).profile(viewerProfile).build();

        UserProfile candProfile = UserProfile.builder().userId(10L).cohort(2018).build();
        User candidate = User.builder().id(10L).profile(candProfile).build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results.get(0).getReasonBadges()).contains("Cùng khóa K2018");
        assertThat(results.get(0).getMatchScore()).isEqualTo(25);
    }

    @Test
    @DisplayName("UTCID04 - Candidate cohort 2019 (diff = 1) -> badge 'Sát khóa (K2019)' and score +15")
    void utcid04_getConnectionSuggestions_okAdjacentCohort() {
        // Given
        UserProfile viewerProfile = UserProfile.builder().userId(99L).cohort(2018).build();
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).profile(viewerProfile).build();

        UserProfile candProfile = UserProfile.builder().userId(10L).cohort(2019).build();
        User candidate = User.builder().id(10L).profile(candProfile).build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results.get(0).getReasonBadges()).contains("Sát khóa (K2019)");
        assertThat(results.get(0).getMatchScore()).isEqualTo(15);
    }

    @Test
    @DisplayName("UTCID05 - Candidate cohort 2021 (diff = 3) -> fallback badge 'Thành viên cộng đồng FPTU', matchScore = 0")
    void utcid05_getConnectionSuggestions_okFarCohortFallback() {
        // Given
        UserProfile viewerProfile = UserProfile.builder().userId(99L).cohort(2018).build();
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).profile(viewerProfile).build();

        UserProfile candProfile = UserProfile.builder().userId(10L).cohort(2021).build();
        User candidate = User.builder().id(10L).profile(candProfile).build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results.get(0).getMatchScore()).isEqualTo(0);
        assertThat(results.get(0).getReasonBadges()).contains("Thành viên cộng đồng FPTU");
    }

    @Test
    @DisplayName("UTCID06 - Same city Ha Noi vs 'ha noi' -> badge 'Đang ở ha noi' and score +15")
    void utcid06_getConnectionSuggestions_okSameCity() {
        // Given
        UserProfile viewerProfile = UserProfile.builder().userId(99L).city("Ha Noi").build();
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).profile(viewerProfile).build();

        UserProfile candProfile = UserProfile.builder().userId(10L).city("ha noi").build();
        User candidate = User.builder().id(10L).profile(candProfile).build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results.get(0).getReasonBadges()).contains("Đang ở ha noi");
        assertThat(results.get(0).getMatchScore()).isEqualTo(15);
    }

    @Test
    @DisplayName("UTCID07 - 2 shared skills (Java, React) -> badge '2 kỹ năng chung' and score +10")
    void utcid07_getConnectionSuggestions_okSharedSkills() {
        // Given
        UserSkill vs1 = UserSkill.builder().skillName("Java").build();
        UserSkill vs2 = UserSkill.builder().skillName("React").build();
        UserProfile viewerProfile = UserProfile.builder().userId(99L).skills(List.of(vs1, vs2)).build();
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).profile(viewerProfile).build();

        UserProfile candProfile = UserProfile.builder().userId(10L).build();
        User candidate = User.builder().id(10L).profile(candProfile).build();
        UserSkill cs1 = UserSkill.builder().user(candidate).skillName("java").build();
        UserSkill cs2 = UserSkill.builder().user(candidate).skillName("react").build();
        UserSkill cs3 = UserSkill.builder().user(candidate).skillName("go").build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candidate));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(10L))).thenReturn(Collections.emptyList());
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(10L))).thenReturn(List.of(cs1, cs2, cs3));
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results.get(0).getReasonBadges()).contains("2 kỹ năng chung");
        assertThat(results.get(0).getMatchScore()).isEqualTo(10);
    }

    @Test
    @DisplayName("UTCID08 - Candidate B has 2 mutual connections -> listed first, badge '2 kết nối chung'")
    void utcid08_getConnectionSuggestions_okMutualPriority() {
        // Given
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).build();
        User candA = User.builder().id(10L).profile(UserProfile.builder().userId(10L).cohort(2018).build()).build();
        User candB = User.builder().id(20L).profile(UserProfile.builder().userId(20L).build()).build();

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(List.of(candA, candB));
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(anyList())).thenReturn(Collections.emptyList());

        List<Object[]> mutualResults = new ArrayList<>();
        mutualResults.add(new Object[]{20L, 2L});
        when(followRepository.countMutualFollowsBatch(eq(99L), anyList())).thenReturn(mutualResults);

        when(userSkillRepository.findByUserIdIn(anyList())).thenReturn(Collections.emptyList());
        when(experienceRepository.findByUserIdOrderByStartDateDesc(99L)).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results.get(0).getUserId()).isEqualTo(20L); // Candidate B listed first
        assertThat(results.get(0).getReasonBadges()).contains("2 kết nối chung");
    }

    @Test
    @DisplayName("UTCID09 - Viewer follows users 7 and 8 -> candidates requested excluding 99, 7, 8")
    void utcid09_getConnectionSuggestions_okExcludeFollowed() {
        // Given
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).build();
        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(List.of(7L, 8L));

        ArgumentCaptor<Set<Long>> excludedCaptor = ArgumentCaptor.forClass(Set.class);
        when(userRepository.findCandidatesForSuggestions(eq(99L), excludedCaptor.capture(), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results).isEmpty();
        Set<Long> excluded = excludedCaptor.getValue();
        assertThat(excluded).containsExactlyInAnyOrder(99L, 7L, 8L);
    }

    @Test
    @DisplayName("UTCID10 - limit = 0 -> defaults to 5")
    void utcid10_getConnectionSuggestions_okLimitZero() {
        // Given
        List<User> sixtyCandidates = new ArrayList<>();
        for (long i = 1; i <= 60; i++) {
            sixtyCandidates.add(User.builder().id(i).build());
        }
        when(userRepository.findGuestCandidates(any(Pageable.class))).thenReturn(sixtyCandidates);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(anyList())).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(null, 0);

        // Then
        assertThat(results).hasSize(5);
    }

    @Test
    @DisplayName("UTCID11 - limit = 100 -> capped to 50")
    void utcid11_getConnectionSuggestions_okLimitAboveMax() {
        // Given
        List<User> sixtyCandidates = new ArrayList<>();
        for (long i = 1; i <= 60; i++) {
            sixtyCandidates.add(User.builder().id(i).build());
        }
        when(userRepository.findGuestCandidates(any(Pageable.class))).thenReturn(sixtyCandidates);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(anyList())).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(null, 100);

        // Then
        assertThat(results).hasSize(50);
    }

    @Test
    @DisplayName("UTCID12 - No candidate available -> empty list, no batch queries")
    void utcid12_getConnectionSuggestions_okEmptyCandidates() {
        // Given
        User viewer = User.builder().id(99L).email(VIEWER_EMAIL).build();
        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(Collections.emptyList());
        when(userRepository.findCandidatesForSuggestions(eq(99L), any(), any(Pageable.class))).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions(VIEWER_EMAIL, 5);

        // Then
        assertThat(results).isEmpty();
        verify(experienceRepository, never()).findByUserIdInAndIsPrimaryTrue(anyList());
        verify(followRepository, never()).countFollowersByUserIds(anyList());
    }

    @Test
    @DisplayName("UTCID13 - Email does not exist -> treated as guest (findGuestCandidates used)")
    void utcid13_getConnectionSuggestions_okUnknownEmailAsGuest() {
        // Given
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());
        when(userRepository.findGuestCandidates(any(Pageable.class))).thenReturn(Collections.emptyList());

        // When
        List<ConnectionSuggestionResponse> results = userService.getConnectionSuggestions("ghost@fpt.edu.vn", 5);

        // Then
        assertThat(results).isEmpty();
        verify(userRepository).findGuestCandidates(any(Pageable.class));
        verify(userRepository, never()).findCandidatesForSuggestions(anyLong(), any(), any());
    }
}
