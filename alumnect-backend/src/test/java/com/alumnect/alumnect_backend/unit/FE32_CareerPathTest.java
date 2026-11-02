package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.careerpath.CareerPathQueryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathDetailResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.careerpath.CareerPathMapper;
import com.alumnect.alumnect_backend.mapper.user.ExperienceMapper;
import com.alumnect.alumnect_backend.service.careerpath.CareerPathServiceImpl;
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

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-32 Manage Career Path (View & Explore Alumni Career Journey).
 * Report sheet : FE-32 (Report5_Unit_Test.xlsx)
 * Functions    : CareerPathServiceImpl.getCareerPaths(), getCareerPathDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-32 Manage Career Path (View & Explore Alumni Career Journey)")
class FE32_CareerPathTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private CareerPathQueryRepository careerPathQueryRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private CareerPathMapper careerPathMapper;

    @Mock
    private ExperienceMapper experienceMapper;

    // ===== System under test =====
    @InjectMocks
    private CareerPathServiceImpl careerPathService;

    // ===== Test data =====
    private Role alumniRole;
    private Role studentRole;
    private User alumnusUser5;
    private User alumnusUser3;
    private UserProfile profile5;
    private UserProfile profile3;

    @BeforeEach
    void setUp() {
        alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        studentRole = Role.builder().id(1L).name("STUDENT").build();

        alumnusUser5 = User.builder()
                .id(5L)
                .email("alumnus5@example.com")
                .accountStatus(AccountStatus.ACTIVE)
                .role(alumniRole)
                .build();

        alumnusUser3 = User.builder()
                .id(3L)
                .email("alumnus3@example.com")
                .accountStatus(AccountStatus.ACTIVE)
                .role(alumniRole)
                .build();

        profile5 = UserProfile.builder()
                .userId(5L)
                .fullName("Alumnus Five")
                .avatarUrl("https://example.com/avatar5.png")
                .user(alumnusUser5)
                .cohort(2018)
                .build();

        profile3 = UserProfile.builder()
                .userId(3L)
                .fullName("Alumnus Three")
                .avatarUrl("https://example.com/avatar3.png")
                .user(alumnusUser3)
                .cohort(2019)
                .build();
    }

    private void stubMapperToSummary() {
        when(careerPathMapper.toSummary(any(UserProfile.class))).thenAnswer(invocation -> {
            UserProfile p = invocation.getArgument(0);
            return CareerPathSummaryResponse.builder()
                    .userId(p.getUserId())
                    .fullName(p.getFullName())
                    .avatarUrl(p.getAvatarUrl())
                    .cohort(p.getCohort())
                    .build();
        });
    }

    // ================= getCareerPaths() =================

    @Test
    @DisplayName("UTCID01 - Repository returns profiles in different order -> Preserves matched id order [5, 3]")
    void utcid01_getCareerPaths_okOrder() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L, 3L), PageRequest.of(0, 10), 2);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        // Repository returns profiles in different order: [profile3, profile5]
        when(userProfileRepository.findAllById(List.of(5L, 3L))).thenReturn(List.of(profile3, profile5));
        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L, 3L))).thenReturn(Collections.emptyList());

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getUserId()).isEqualTo(5L);
        assertThat(result.getContent().get(1).getUserId()).isEqualTo(3L);
    }

    @Test
    @DisplayName("UTCID02 - Primary experience exists -> Sets current title, company, location from primary")
    void utcid02_getCareerPaths_okPrimary() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L), PageRequest.of(0, 10), 1);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(5L))).thenReturn(List.of(profile5));

        Experience exp1 = Experience.builder()
                .id(1L)
                .user(alumnusUser5)
                .title("Developer")
                .company("Old Corp")
                .startDate(LocalDate.of(2018, 1, 1))
                .isCurrent(false)
                .isPrimary(false)
                .build();
        Experience exp2 = Experience.builder()
                .id(2L)
                .user(alumnusUser5)
                .title("Tech Lead")
                .company("FPT Software")
                .location("Hanoi")
                .startDate(LocalDate.of(2021, 1, 1))
                .isCurrent(true)
                .isPrimary(true)
                .build();

        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L))).thenReturn(List.of(exp1, exp2));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        CareerPathSummaryResponse summary = result.getContent().get(0);
        assertThat(summary.getCurrentTitle()).isEqualTo("Tech Lead");
        assertThat(summary.getCurrentCompany()).isEqualTo("FPT Software");
        assertThat(summary.getCurrentLocation()).isEqualTo("Hanoi");
        assertThat(summary.getTotalExperiences()).isEqualTo(2);
    }

    @Test
    @DisplayName("UTCID03 - No primary but two current experiences -> Fallback to latest started current experience")
    void utcid03_getCareerPaths_okFallbackLatestCurrent() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L), PageRequest.of(0, 10), 1);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(5L))).thenReturn(List.of(profile5));

        Experience exp2020 = Experience.builder()
                .id(1L)
                .user(alumnusUser5)
                .title("Consultant")
                .company("Company A")
                .startDate(LocalDate.of(2020, 1, 1))
                .isCurrent(true)
                .isPrimary(false)
                .build();
        Experience exp2023 = Experience.builder()
                .id(2L)
                .user(alumnusUser5)
                .title("Senior Consultant")
                .company("Company B")
                .location("Da Nang")
                .startDate(LocalDate.of(2023, 6, 1))
                .isCurrent(true)
                .isPrimary(false)
                .build();

        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L))).thenReturn(List.of(exp2020, exp2023));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        CareerPathSummaryResponse summary = result.getContent().get(0);
        assertThat(summary.getCurrentTitle()).isEqualTo("Senior Consultant");
        assertThat(summary.getCurrentCompany()).isEqualTo("Company B");
        assertThat(summary.getCurrentLocation()).isEqualTo("Da Nang");
    }

    @Test
    @DisplayName("UTCID04 - Only ended experiences -> currentTitle and currentCompany stay null")
    void utcid04_getCareerPaths_okEndedOnly() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L), PageRequest.of(0, 10), 1);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(5L))).thenReturn(List.of(profile5));

        Experience expEnded1 = Experience.builder()
                .id(1L)
                .user(alumnusUser5)
                .title("Intern")
                .company("Company X")
                .startDate(LocalDate.of(2018, 1, 1))
                .endDate(LocalDate.of(2019, 1, 1))
                .isCurrent(false)
                .isPrimary(false)
                .build();
        Experience expEnded2 = Experience.builder()
                .id(2L)
                .user(alumnusUser5)
                .title("Junior")
                .company("Company Y")
                .startDate(LocalDate.of(2019, 2, 1))
                .endDate(LocalDate.of(2021, 1, 1))
                .isCurrent(false)
                .isPrimary(false)
                .build();

        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L))).thenReturn(List.of(expEnded1, expEnded2));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        CareerPathSummaryResponse summary = result.getContent().get(0);
        assertThat(summary.getCurrentTitle()).isNull();
        assertThat(summary.getCurrentCompany()).isNull();
        assertThat(summary.getTotalExperiences()).isEqualTo(2);
    }

    @Test
    @DisplayName("UTCID05 - Consecutive duplicate experiences -> Merged in career preview")
    void utcid05_getCareerPaths_okMergeConsecutiveDuplicates() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L), PageRequest.of(0, 10), 1);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(5L))).thenReturn(List.of(profile5));

        Experience exp1 = Experience.builder()
                .id(1L)
                .user(alumnusUser5)
                .title("Dev")
                .company("FPT")
                .startDate(LocalDate.of(2018, 1, 1))
                .isCurrent(false)
                .build();
        Experience exp2 = Experience.builder()
                .id(2L)
                .user(alumnusUser5)
                .title("dev ")
                .company(" fpt")
                .startDate(LocalDate.of(2019, 1, 1))
                .isCurrent(false)
                .build();
        Experience exp3 = Experience.builder()
                .id(3L)
                .user(alumnusUser5)
                .title("Senior Dev")
                .company("FPT")
                .startDate(LocalDate.of(2021, 1, 1))
                .isCurrent(true)
                .build();

        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L))).thenReturn(List.of(exp1, exp2, exp3));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        CareerPathSummaryResponse summary = result.getContent().get(0);
        assertThat(summary.getCareerPreview()).hasSize(2);
        assertThat(summary.getTotalExperiences()).isEqualTo(3);
    }

    @Test
    @DisplayName("UTCID06 - 5 distinct experiences -> careerPreview capped at 4 items")
    void utcid06_getCareerPaths_okCareerPreviewCap4() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L), PageRequest.of(0, 10), 1);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(5L))).thenReturn(List.of(profile5));

        Experience e1 = Experience.builder().id(1L).user(alumnusUser5).title("Intern").company("C1").startDate(LocalDate.of(2017, 1, 1)).build();
        Experience e2 = Experience.builder().id(2L).user(alumnusUser5).title("Junior").company("C2").startDate(LocalDate.of(2018, 1, 1)).build();
        Experience e3 = Experience.builder().id(3L).user(alumnusUser5).title("Mid").company("C3").startDate(LocalDate.of(2019, 1, 1)).build();
        Experience e4 = Experience.builder().id(4L).user(alumnusUser5).title("Senior").company("C4").startDate(LocalDate.of(2021, 1, 1)).build();
        Experience e5 = Experience.builder().id(5L).user(alumnusUser5).title("Lead").company("C5").startDate(LocalDate.of(2023, 1, 1)).build();

        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L))).thenReturn(List.of(e1, e2, e3, e4, e5));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        CareerPathSummaryResponse summary = result.getContent().get(0);
        assertThat(summary.getCareerPreview()).hasSize(4);
        assertThat(summary.getTotalExperiences()).isEqualTo(5);
    }

    @Test
    @DisplayName("UTCID07 - Page size 51 -> Capped to 50 in repository call")
    void utcid07_getCareerPaths_okPageSizeCapped50() {
        // Given
        when(careerPathQueryRepository.findActiveAlumniUserIds(
                null, null, null, null, null, null, PageRequest.of(0, 50)))
                .thenReturn(Page.empty(PageRequest.of(0, 50)));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 51);

        // Then
        assertThat(result.getContent()).isEmpty();
        verify(careerPathQueryRepository).findActiveAlumniUserIds(
                null, null, null, null, null, null, PageRequest.of(0, 50));
    }

    @Test
    @DisplayName("UTCID08 - Page size 50 -> Stays 50 in repository call")
    void utcid08_getCareerPaths_okPageSize50() {
        // Given
        when(careerPathQueryRepository.findActiveAlumniUserIds(
                null, null, null, null, null, null, PageRequest.of(0, 50)))
                .thenReturn(Page.empty(PageRequest.of(0, 50)));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 50);

        // Then
        assertThat(result.getContent()).isEmpty();
        verify(careerPathQueryRepository).findActiveAlumniUserIds(
                null, null, null, null, null, null, PageRequest.of(0, 50));
    }

    @Test
    @DisplayName("UTCID09 - No alumni match filter -> Returns empty PageResponse and skips further queries")
    void utcid09_getCareerPaths_okEmpty() {
        // Given
        when(careerPathQueryRepository.findActiveAlumniUserIds(
                null, null, "No Such Company", null, null, null, PageRequest.of(0, 10)))
                .thenReturn(Page.empty(PageRequest.of(0, 10)));

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, "No Such Company", null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).isEmpty();
        verify(userProfileRepository, never()).findAllById(any());
        verify(experienceRepository, never()).findByUserIdsSortedChronologically(any());
    }

    @Test
    @DisplayName("UTCID10 - Matched id has no profile row -> Missing profile skipped, remaining returned")
    void utcid10_getCareerPaths_okSkipMissingProfile() {
        // Given
        stubMapperToSummary();
        Page<Long> page = new PageImpl<>(List.of(5L, 9L), PageRequest.of(0, 10), 2);
        when(careerPathQueryRepository.findActiveAlumniUserIds(null, null, null, null, null, null, PageRequest.of(0, 10)))
                .thenReturn(page);
        // User 9 has no UserProfile record in DB
        when(userProfileRepository.findAllById(List.of(5L, 9L))).thenReturn(List.of(profile5));
        when(experienceRepository.findByUserIdsSortedChronologically(List.of(5L, 9L))).thenReturn(Collections.emptyList());

        // When
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                null, null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUserId()).isEqualTo(5L);
    }

    // ================= getCareerPathDetail() =================

    @Test
    @DisplayName("UTCID11 - Active alumnus with 2 experiences -> Returns CareerPathDetailResponse")
    void utcid11_getCareerPathDetail_ok() {
        // Given
        when(userProfileRepository.findById(5L)).thenReturn(Optional.of(profile5));

        Experience exp1 = Experience.builder()
                .id(1L)
                .user(alumnusUser5)
                .title("Developer")
                .company("Company A")
                .startDate(LocalDate.of(2019, 1, 1))
                .build();
        Experience exp2 = Experience.builder()
                .id(2L)
                .user(alumnusUser5)
                .title("Tech Lead")
                .company("FPT Software")
                .startDate(LocalDate.of(2022, 1, 1))
                .build();

        when(experienceRepository.findByUserIdsSortedChronologically(Collections.singletonList(5L)))
                .thenReturn(List.of(exp1, exp2));

        when(experienceMapper.toResponse(any(Experience.class))).thenAnswer(invocation -> {
            Experience e = invocation.getArgument(0);
            return ExperienceResponse.builder()
                    .id(e.getId())
                    .title(e.getTitle())
                    .company(e.getCompany())
                    .build();
        });

        // When
        CareerPathDetailResponse response = careerPathService.getCareerPathDetail(5L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(5L);
        assertThat(response.getFullName()).isEqualTo("Alumnus Five");
        assertThat(response.getExperiences()).hasSize(2);
    }

    @Test
    @DisplayName("UTCID12 - Profile 404 not found -> ResourceNotFoundException")
    void utcid12_getCareerPathDetail_notFound() {
        // Given
        when(userProfileRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> careerPathService.getCareerPathDetail(404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy hồ sơ người dùng với ID: 404");
    }

    @Test
    @DisplayName("UTCID13 - User role is STUDENT -> BadRequestException")
    void utcid13_getCareerPathDetail_badRequestNotAlumni() {
        // Given
        User studentUser = User.builder()
                .id(6L)
                .accountStatus(AccountStatus.ACTIVE)
                .role(studentRole)
                .build();
        UserProfile studentProfile = UserProfile.builder()
                .userId(6L)
                .user(studentUser)
                .build();

        when(userProfileRepository.findById(6L)).thenReturn(Optional.of(studentProfile));

        // When + Then
        assertThatThrownBy(() -> careerPathService.getCareerPathDetail(6L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Người dùng này không hoạt động hoặc không phải là cựu sinh viên");
    }

    @Test
    @DisplayName("UTCID14 - Alumnus account status is LOCKED -> BadRequestException")
    void utcid14_getCareerPathDetail_badRequestLocked() {
        // Given
        User lockedAlumnus = User.builder()
                .id(7L)
                .accountStatus(AccountStatus.LOCKED)
                .role(alumniRole)
                .build();
        UserProfile lockedProfile = UserProfile.builder()
                .userId(7L)
                .user(lockedAlumnus)
                .build();

        when(userProfileRepository.findById(7L)).thenReturn(Optional.of(lockedProfile));

        // When + Then
        assertThatThrownBy(() -> careerPathService.getCareerPathDetail(7L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Người dùng này không hoạt động hoặc không phải là cựu sinh viên");
    }

    @Test
    @DisplayName("UTCID15 - Active alumnus with no experiences -> Returns empty experiences list")
    void utcid15_getCareerPathDetail_okNoExperience() {
        // Given
        when(userProfileRepository.findById(5L)).thenReturn(Optional.of(profile5));
        when(experienceRepository.findByUserIdsSortedChronologically(Collections.singletonList(5L)))
                .thenReturn(Collections.emptyList());

        // When
        CareerPathDetailResponse response = careerPathService.getCareerPathDetail(5L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(5L);
        assertThat(response.getExperiences()).isEmpty();
    }
}
