package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.response.user.UserDirectoryResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserFilterOptionsResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Follow;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.mapper.user.UserProfileMapper;
import com.alumnect.alumnect_backend.service.user.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-08 Search Users & Alumni Directory.
 * Report sheet : FE-08 (Report5_Unit_Test.xlsx)
 * Functions    : UserServiceImpl.searchUsers(), getFilterOptions()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-08 Search Users & Alumni Directory")
class FE08_SearchUsersTest {

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

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ================= searchUsers() =================

    @Test
    @DisplayName("UTCID01 - Anonymous visitor searches with all filters -> returns PageResponse with 2 users")
    void utcid01_searchUsers_ok() {
        // Given
        UserProfile p1 = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();
        UserProfile p2 = UserProfile.builder().userId(2L).fullName("Nguyen Van B").build();
        User u1 = User.builder().id(1L).profile(p1).build();
        User u2 = User.builder().id(2L).profile(p2).build();
        Page<User> page = new PageImpl<>(List.of(u1, u2), Pageable.unpaged(), 2);

        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(anyList())).thenReturn(Collections.emptyList());
        when(userProfileMapper.toDirectoryResponse(p1)).thenReturn(UserDirectoryResponse.builder().userId(1L).build());
        when(userProfileMapper.toDirectoryResponse(p2)).thenReturn(UserDirectoryResponse.builder().userId(2L).build());

        // When
        PageResponse<UserDirectoryResponse> response = userService.searchUsers(
                "nguyen", "ALUMNI", 1L, 2018, "Ha Noi", "Java", "FPT", 0, 10, "createdAt", "DESC"
        );

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        assertThat(response.getContent().get(0).getIsFollowing()).isFalse();
        assertThat(response.getContent().get(0).getFollowersCount()).isEqualTo(0L);
    }

    @Test
    @DisplayName("UTCID02 - sortBy=fullName, sortDirection=asc -> Pageable sorted by profile.fullName ASC")
    void utcid02_searchUsers_okSortFullName() {
        // Given
        Page<User> emptyPage = new PageImpl<>(Collections.emptyList());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(userRepository.findAll(any(Specification.class), pageableCaptor.capture())).thenReturn(emptyPage);

        // When
        userService.searchUsers(null, null, null, null, null, null, null, 0, 10, "fullName", "asc");

        // Then
        Pageable captured = pageableCaptor.getValue();
        Sort.Order order = captured.getSort().getOrderFor("profile.fullName");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("UTCID03 - sortBy=cohort, sortDirection=DESC -> Pageable sorted by profile.cohort DESC")
    void utcid03_searchUsers_okSortCohort() {
        // Given
        Page<User> emptyPage = new PageImpl<>(Collections.emptyList());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(userRepository.findAll(any(Specification.class), pageableCaptor.capture())).thenReturn(emptyPage);

        // When
        userService.searchUsers(null, null, null, null, null, null, null, 0, 10, "cohort", "DESC");

        // Then
        Pageable captured = pageableCaptor.getValue();
        Sort.Order order = captured.getSort().getOrderFor("profile.cohort");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID04 - sortBy=unknownField, sortDirection=null -> falls back to createdAt DESC")
    void utcid04_searchUsers_okSortFallback() {
        // Given
        Page<User> emptyPage = new PageImpl<>(Collections.emptyList());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(userRepository.findAll(any(Specification.class), pageableCaptor.capture())).thenReturn(emptyPage);

        // When
        userService.searchUsers(null, null, null, null, null, null, null, 0, 10, "unknownField", null);

        // Then
        Pageable captured = pageableCaptor.getValue();
        Sort.Order order = captured.getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID05 - No user matches filters -> empty PageResponse, no batch queries")
    void utcid05_searchUsers_okEmpty() {
        // Given
        Page<User> emptyPage = new PageImpl<>(Collections.emptyList());
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<UserDirectoryResponse> response = userService.searchUsers(
                "zzz-no-match", null, null, null, null, null, null, 0, 10, null, null
        );

        // Then
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
        verify(experienceRepository, never()).findByUserIdInAndIsPrimaryTrue(anyList());
        verify(followRepository, never()).countFollowersByUserIds(anyList());
    }

    @Test
    @DisplayName("UTCID06 - Viewer logged in (id 99), follows user 1, 3 mutual -> item reflects stats")
    void utcid06_searchUsers_okViewerWithMutual() {
        // Given
        String viewerEmail = "viewer@fpt.edu.vn";
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(viewerEmail, null, Collections.emptyList()));

        User viewer = User.builder().id(99L).email(viewerEmail).build();
        UserProfile p1 = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();
        User u1 = User.builder().id(1L).profile(p1).build();
        Page<User> page = new PageImpl<>(List.of(u1));

        when(userRepository.findByEmail(viewerEmail)).thenReturn(Optional.of(viewer));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(1L))).thenReturn(Collections.emptyList());

        List<Object[]> followersCount = new ArrayList<>();
        followersCount.add(new Object[]{1L, 5L});
        when(followRepository.countFollowersByUserIds(List.of(1L))).thenReturn(followersCount);

        List<Object[]> followingCount = new ArrayList<>();
        followingCount.add(new Object[]{1L, 2L});
        when(followRepository.countFollowingByUserIds(List.of(1L))).thenReturn(followingCount);

        Follow followRelation = Follow.builder().follower(viewer).following(u1).build();
        when(followRepository.findByFollowerIdAndFollowingIdIn(99L, List.of(1L))).thenReturn(List.of(followRelation));

        List<Object[]> mutualResults = new ArrayList<>();
        mutualResults.add(new Object[]{1L, 3L});
        when(followRepository.countMutualFollowsBatch(99L, List.of(1L))).thenReturn(mutualResults);

        when(userProfileMapper.toDirectoryResponse(p1)).thenReturn(UserDirectoryResponse.builder().userId(1L).build());

        // When
        PageResponse<UserDirectoryResponse> response = userService.searchUsers(
                null, null, null, null, null, null, null, 0, 10, null, null
        );

        // Then
        UserDirectoryResponse item = response.getContent().get(0);
        assertThat(item.getIsFollowing()).isTrue();
        assertThat(item.getMutualFollowsCount()).isEqualTo(3L);
        assertThat(item.getFollowersCount()).isEqualTo(5L);
        assertThat(item.getFollowingCount()).isEqualTo(2L);
    }

    @Test
    @DisplayName("UTCID07 - Matched user has no profile row -> fallback item built from User")
    void utcid07_searchUsers_okFallbackNoProfile() {
        // Given
        Role role = Role.builder().name("ALUMNI").build();
        User u1 = User.builder().id(1L).email("user@fpt.edu.vn").role(role).isAccountVerified(true).profile(null).build();
        Page<User> page = new PageImpl<>(List.of(u1));

        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(1L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(1L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(1L))).thenReturn(Collections.emptyList());

        // When
        PageResponse<UserDirectoryResponse> response = userService.searchUsers(
                null, null, null, null, null, null, null, 0, 10, null, null
        );

        // Then
        UserDirectoryResponse item = response.getContent().get(0);
        assertThat(item.getUserId()).isEqualTo(1L);
        assertThat(item.getEmail()).isEqualTo("user@fpt.edu.vn");
        assertThat(item.getRole()).isEqualTo("ALUMNI");
        assertThat(item.getIsAccountVerified()).isTrue();
    }

    @Test
    @DisplayName("UTCID08 - page = 0, size = 1 -> PageResponse with pageNumber=0, pageSize=1")
    void utcid08_searchUsers_okPageBound() {
        // Given
        User u1 = User.builder().id(1L).build();
        Page<User> page = new PageImpl<>(List.of(u1), Pageable.ofSize(1), 5);
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(1L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowersByUserIds(List.of(1L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(1L))).thenReturn(Collections.emptyList());

        // When
        PageResponse<UserDirectoryResponse> response = userService.searchUsers(
                null, null, null, null, null, null, null, 0, 1, null, null
        );

        // Then
        assertThat(response.getPageNumber()).isEqualTo(0);
        assertThat(response.getPageSize()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID09 - Duplicate primary experiences for same user -> kept first (no exception)")
    void utcid09_searchUsers_okDuplicatePrimaryExperience() {
        // Given
        User u1 = User.builder().id(1L).build();
        Page<User> page = new PageImpl<>(List.of(u1));

        Experience expA = Experience.builder().id(10L).user(u1).title("Title A").company("Company A").build();
        Experience expB = Experience.builder().id(11L).user(u1).title("Title B").company("Company B").build();

        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(experienceRepository.findByUserIdInAndIsPrimaryTrue(List.of(1L))).thenReturn(List.of(expA, expB));
        when(followRepository.countFollowersByUserIds(List.of(1L))).thenReturn(Collections.emptyList());
        when(followRepository.countFollowingByUserIds(List.of(1L))).thenReturn(Collections.emptyList());

        // When
        PageResponse<UserDirectoryResponse> response = userService.searchUsers(
                null, null, null, null, null, null, null, 0, 10, null, null
        );

        // Then
        assertThat(response.getContent().get(0).getPrimaryExperience().getTitle()).isEqualTo("Title A");
    }

    // ================= getFilterOptions() =================

    @Test
    @DisplayName("UTCID10 - DB has cohorts and cities -> returns lists")
    void utcid10_getFilterOptions_ok() {
        // Given
        when(userProfileRepository.findDistinctCohorts()).thenReturn(List.of(2018, 2019));
        when(userProfileRepository.findDistinctCities()).thenReturn(List.of("Ha Noi", "Da Nang"));

        // When
        UserFilterOptionsResponse response = userService.getFilterOptions();

        // Then
        assertThat(response.getCohorts()).containsExactly(2018, 2019);
        assertThat(response.getCities()).containsExactly("Ha Noi", "Da Nang");
    }

    @Test
    @DisplayName("UTCID11 - DB has no profile data -> returns empty lists")
    void utcid11_getFilterOptions_okEmpty() {
        // Given
        when(userProfileRepository.findDistinctCohorts()).thenReturn(Collections.emptyList());
        when(userProfileRepository.findDistinctCities()).thenReturn(Collections.emptyList());

        // When
        UserFilterOptionsResponse response = userService.getFilterOptions();

        // Then
        assertThat(response.getCohorts()).isEmpty();
        assertThat(response.getCities()).isEmpty();
    }
}
