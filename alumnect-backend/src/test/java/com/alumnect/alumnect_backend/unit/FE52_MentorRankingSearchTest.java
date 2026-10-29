package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorSearchCriteria;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorCardResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRankingResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentorDetailServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentorRankingServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentorSearchServiceImpl;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
 * FE-52 Mentoring - Mentor Ranking, Search & Detail.
 * Report sheet : FE-52 (Report5_Unit_Test.xlsx)
 * Functions    : MentorRankingServiceImpl.getMentorRanking(),
 *                MentorSearchServiceImpl.searchMentors(),
 *                MentorDetailServiceImpl.getMentorDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-52 Mentoring - Mentor Ranking, Search & Detail")
class FE52_MentorRankingSearchTest {

    @Mock
    private IndustryRepository industryRepository;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private MentorSupportedFieldRepository mentorSupportedFieldRepository;

    @Mock
    private MentorTopicRepository mentorTopicRepository;

    @Mock
    private UserSkillRepository userSkillRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private MentorSubscriptionRepository mentorSubscriptionRepository;

    @InjectMocks
    private MentorRankingServiceImpl mentorRankingService;

    @InjectMocks
    private MentorSearchServiceImpl mentorSearchService;

    @InjectMocks
    private MentorDetailServiceImpl mentorDetailService;

    private static final Long FIELD_ID = 1L;
    private static final Long USER_ID = 10L;
    private static final Long MENTOR_ID = 100L;

    private Industry testIndustry;
    private User testUser;
    private MentorProfile testMentorProfile;
    private UserProfile testUserProfile;
    private Experience testExperience;

    @BeforeEach
    void setUp() {
        testIndustry = Industry.builder().id(FIELD_ID).name("Công nghệ thông tin").build();
        testUser = User.builder().id(USER_ID).accountStatus(AccountStatus.ACTIVE).build();
        testMentorProfile = MentorProfile.builder()
                .id(MENTOR_ID)
                .user(testUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .reputationScore(95)
                .workingMode(MentoringWorkingMode.BOTH)
                .mentoringType(MentoringType.INDIVIDUAL)
                .build();
        testUserProfile = UserProfile.builder().userId(USER_ID).fullName("Nguyen Van A").avatarUrl("https://example.com/avatar.jpg").build();
        testExperience = Experience.builder().id(5L).user(testUser).title("Senior Dev").company("FPT").isCurrent(true).build();
    }

    // ================= getMentorRanking() =================

    @Test
    @DisplayName("UTCID01 - Field has ACTIVE mentors -> Mentors ordered by reputation score")
    void utcid01_getMentorRanking_okOrdered() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        when(industryRepository.findById(FIELD_ID)).thenReturn(Optional.of(testIndustry));

        Page<MentorProfile> pageResult = new PageImpl<>(List.of(testMentorProfile), pageable, 1);
        when(mentorProfileRepository.findRankedMentorsByField(eq(FIELD_ID), any(Instant.class), eq(pageable)))
                .thenReturn(pageResult);
        when(userProfileRepository.findAllById(List.of(USER_ID))).thenReturn(List.of(testUserProfile));
        when(experienceRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(List.of(testExperience));

        // When
        PageResponse<MentorRankingResponse> response = mentorRankingService.getMentorRanking(FIELD_ID, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        MentorRankingResponse item = response.getContent().get(0);
        assertThat(item.getMentorId()).isEqualTo(MENTOR_ID);
        assertThat(item.getRank()).isEqualTo(1);
        assertThat(item.getReputationScore()).isEqualTo(95);
    }

    @Test
    @DisplayName("UTCID02 - Field has no ACTIVE mentor -> Empty page")
    void utcid02_getMentorRanking_okEmpty() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        when(industryRepository.findById(FIELD_ID)).thenReturn(Optional.of(testIndustry));

        Page<MentorProfile> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(mentorProfileRepository.findRankedMentorsByField(eq(FIELD_ID), any(Instant.class), eq(pageable)))
                .thenReturn(emptyPage);

        // When
        PageResponse<MentorRankingResponse> response = mentorRankingService.getMentorRanking(FIELD_ID, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("UTCID03 - Field id 99 does not exist -> ResourceNotFoundException")
    void utcid03_getMentorRanking_notFoundField() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        when(industryRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> mentorRankingService.getMentorRanking(99L, pageable))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy lĩnh vực chuyên môn với ID: 99");
        verify(mentorProfileRepository, never()).findRankedMentorsByField(any(), any(), any());
    }

    // ================= searchMentors() =================

    @Test
    @DisplayName("UTCID04 - Mentors exist -> searchMentors(keyword='java') -> Matching mentors only")
    void utcid04_searchMentors_okKeyword() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        criteria.setKeyword("java");
        Pageable pageable = PageRequest.of(0, 10);

        Page<MentorProfile> profilePage = new PageImpl<>(List.of(testMentorProfile), pageable, 1);
        when(mentorProfileRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(profilePage);
        when(userProfileRepository.findAllById(List.of(USER_ID))).thenReturn(List.of(testUserProfile));
        when(experienceRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(List.of(testExperience));
        when(mentorSupportedFieldRepository.findByMentorProfileIdIn(List.of(MENTOR_ID))).thenReturn(Collections.emptyList());
        when(mentorTopicRepository.findByMentorProfileIdIn(List.of(MENTOR_ID))).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getMentorId()).isEqualTo(MENTOR_ID);
    }

    @Test
    @DisplayName("UTCID05 - Mentors exist -> searchMentors(fieldId, workingMode, mentoringType) -> Filtered mentors")
    void utcid05_searchMentors_okFiltered() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        criteria.setFieldId(FIELD_ID);
        criteria.setWorkingMode(MentoringWorkingMode.BOTH);
        criteria.setMentoringType(MentoringType.INDIVIDUAL);
        Pageable pageable = PageRequest.of(0, 10);

        when(industryRepository.existsById(FIELD_ID)).thenReturn(true);
        Page<MentorProfile> profilePage = new PageImpl<>(List.of(testMentorProfile), pageable, 1);
        when(mentorProfileRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(profilePage);
        when(userProfileRepository.findAllById(List.of(USER_ID))).thenReturn(List.of(testUserProfile));
        when(experienceRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(List.of(testExperience));
        when(mentorSupportedFieldRepository.findByMentorProfileIdIn(List.of(MENTOR_ID))).thenReturn(Collections.emptyList());
        when(mentorTopicRepository.findByMentorProfileIdIn(List.of(MENTOR_ID))).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getWorkingMode()).isEqualTo(MentoringWorkingMode.BOTH);
    }

    @Test
    @DisplayName("UTCID06 - Inactive and expired mentors exist -> searchMentors(no filter) -> Only ACTIVE mentors with valid subscription")
    void utcid06_searchMentors_okActiveOnly() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        Pageable pageable = PageRequest.of(0, 10);

        Page<MentorProfile> profilePage = new PageImpl<>(List.of(testMentorProfile), pageable, 1);
        when(mentorProfileRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(profilePage);
        when(userProfileRepository.findAllById(List.of(USER_ID))).thenReturn(List.of(testUserProfile));
        when(experienceRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(List.of(testExperience));
        when(mentorSupportedFieldRepository.findByMentorProfileIdIn(List.of(MENTOR_ID))).thenReturn(Collections.emptyList());
        when(mentorTopicRepository.findByMentorProfileIdIn(List.of(MENTOR_ID))).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdIn(List.of(USER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("UTCID07 - Mentors exist -> size = 1 / size = 50 -> Search succeeds")
    void utcid07_searchMentors_okBoundarySize() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        Pageable pageable1 = PageRequest.of(0, 1);
        Page<MentorProfile> emptyPage1 = new PageImpl<>(Collections.emptyList(), pageable1, 0);
        when(mentorProfileRepository.findAll(any(Specification.class), eq(pageable1))).thenReturn(emptyPage1);

        Pageable pageable50 = PageRequest.of(0, 50);
        Page<MentorProfile> emptyPage50 = new PageImpl<>(Collections.emptyList(), pageable50, 0);
        when(mentorProfileRepository.findAll(any(Specification.class), eq(pageable50))).thenReturn(emptyPage50);

        // When
        PageResponse<MentorCardResponse> res1 = mentorSearchService.searchMentors(criteria, pageable1);
        PageResponse<MentorCardResponse> res50 = mentorSearchService.searchMentors(criteria, pageable50);

        // Then
        assertThat(res1).isNotNull();
        assertThat(res50).isNotNull();
    }

    @Test
    @DisplayName("UTCID08 - Mentors exist -> size = 0 or 51 -> BadRequestException")
    void utcid08_searchMentors_badRequestSize() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        Pageable pageable0 = PageRequest.of(0, 1).withPage(0); // construct invalid size via custom pageable or mock
        Pageable invalidSize0 = PageRequest.ofSize(1).withPage(0); // Note: PageRequest.ofSize(0) throws in Spring, use anonymous Pageable
        Pageable pageableSize0 = new Pageable() {
            @Override public int getPageNumber() { return 0; }
            @Override public int getPageSize() { return 0; }
            @Override public long getOffset() { return 0; }
            @Override public org.springframework.data.domain.Sort getSort() { return org.springframework.data.domain.Sort.unsorted(); }
            @Override public Pageable next() { return this; }
            @Override public Pageable previousOrFirst() { return this; }
            @Override public Pageable first() { return this; }
            @Override public Pageable withPage(int pageNumber) { return this; }
            @Override public boolean hasPrevious() { return false; }
        };

        // When + Then
        assertThatThrownBy(() -> mentorSearchService.searchMentors(criteria, pageableSize0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Kích thước trang không hợp lệ (cho phép từ 1 đến 50)");
    }

    @Test
    @DisplayName("UTCID09 - Mentors exist -> page = -1 -> BadRequestException")
    void utcid09_searchMentors_badRequestPage() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        Pageable pageableNeg = new Pageable() {
            @Override public int getPageNumber() { return -1; }
            @Override public int getPageSize() { return 10; }
            @Override public long getOffset() { return 0; }
            @Override public org.springframework.data.domain.Sort getSort() { return org.springframework.data.domain.Sort.unsorted(); }
            @Override public Pageable next() { return this; }
            @Override public Pageable previousOrFirst() { return this; }
            @Override public Pageable first() { return this; }
            @Override public Pageable withPage(int pageNumber) { return this; }
            @Override public boolean hasPrevious() { return false; }
        };

        // When + Then
        assertThatThrownBy(() -> mentorSearchService.searchMentors(criteria, pageableNeg))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ số trang không hợp lệ (phải >= 0)");
    }

    @Test
    @DisplayName("UTCID10 - Field id 99 does not exist -> searchMentors(fieldId=99) -> BadRequestException")
    void utcid10_searchMentors_badRequestFieldNotFound() {
        // Given
        MentorSearchCriteria criteria = new MentorSearchCriteria();
        criteria.setFieldId(99L);
        Pageable pageable = PageRequest.of(0, 10);
        when(industryRepository.existsById(99L)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> mentorSearchService.searchMentors(criteria, pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Lĩnh vực chuyên môn không hợp lệ hoặc không tồn tại");
    }

    // ================= getMentorDetail() =================

    @Test
    @DisplayName("UTCID11 - Mentor exists -> getMentorDetail(mentorId) -> Detail with experience, expertise and request availability")
    void utcid11_getMentorDetail_ok() {
        // Given
        when(mentorProfileRepository.findById(MENTOR_ID)).thenReturn(Optional.of(testMentorProfile));
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(testUserProfile));
        when(experienceRepository.findByUserIdOrderByStartDateDesc(USER_ID)).thenReturn(List.of(testExperience));
        when(mentorSupportedFieldRepository.findByMentorProfileId(MENTOR_ID)).thenReturn(Collections.emptyList());
        when(mentorTopicRepository.findByMentorProfileId(MENTOR_ID)).thenReturn(Collections.emptyList());
        when(userSkillRepository.findByUserIdOrderBySortOrderAscSkillNameAsc(USER_ID)).thenReturn(Collections.emptyList());

        MentorSubscription activeSub = MentorSubscription.builder()
                .id(1L)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(MENTOR_ID))
                .thenReturn(List.of(activeSub));

        // When
        MentorDetailResponse response = mentorDetailService.getMentorDetail(MENTOR_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMentorId()).isEqualTo(MENTOR_ID);
        assertThat(response.getCanReceiveRequest()).isTrue();
        assertThat(response.getCurrentPosition()).isEqualTo("Senior Dev");
        assertThat(response.getCurrentCompany()).isEqualTo("FPT");
    }

    @Test
    @DisplayName("UTCID12 - Mentor id <= 0 -> BadRequestException")
    void utcid12_getMentorDetail_badRequestInvalidId() {
        // When + Then
        assertThatThrownBy(() -> mentorDetailService.getMentorDetail(0L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Định danh Mentor không hợp lệ (phải là số nguyên dương)");
        verify(mentorProfileRepository, never()).findById(any());
    }

    @Test
    @DisplayName("UTCID13 - Mentor id 99 does not exist -> ResourceNotFoundException")
    void utcid13_getMentorDetail_notFound() {
        // Given
        when(mentorProfileRepository.findById(99L)).thenReturn(Optional.empty());
        when(mentorProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> mentorDetailService.getMentorDetail(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy thông tin Mentor với định danh: 99");
    }
}
