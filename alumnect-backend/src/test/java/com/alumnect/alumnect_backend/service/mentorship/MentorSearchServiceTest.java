package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorSearchCriteria;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorCardResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorFilterOptionsResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.MentorTopic;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.exception.BadRequestException;
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
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho MentorSearchService (UC98 - Tìm kiếm & Lọc Mentor).
 * Bao phủ các ca kiểm thử nghiệp vụ từ TC01 đến TC18.
 */
@ExtendWith(MockitoExtension.class)
class MentorSearchServiceTest {

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
    private IndustryRepository industryRepository;

    @Mock
    private MajorRepository majorRepository;

    @InjectMocks
    private MentorSearchServiceImpl mentorSearchService;

    private User sampleUser;
    private UserProfile sampleUserProfile;
    private Major sampleMajor;
    private Industry sampleIndustry;
    private MentorProfile sampleProfile;
    private Experience sampleExperience;
    private MentorSupportedField sampleSupportedField;
    private MentorTopic sampleTopic;
    private UserSkill sampleSkill;

    @BeforeEach
    void setUp() {
        sampleMajor = Major.builder()
                .id(1L)
                .code("SE")
                .name("Kỹ thuật phần mềm")
                .build();

        sampleIndustry = Industry.builder()
                .id(10L)
                .name("Công nghệ thông tin")
                .build();

        sampleUser = User.builder()
                .id(100L)
                .email("mentor@fpt.edu.vn")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        sampleUserProfile = UserProfile.builder()
                .userId(100L)
                .user(sampleUser)
                .fullName("Nguyễn Văn Mentor")
                .avatarUrl("https://example.com/avatar.jpg")
                .headline("Senior Java Engineer @ FPT Software")
                .major(sampleMajor)
                .build();

        sampleProfile = MentorProfile.builder()
                .id(1L)
                .user(sampleUser)
                .bio("Chào các bạn, mình hỗ trợ kiến trúc hệ thống và Spring Boot.")
                .workingMode(MentoringWorkingMode.ONLINE)
                .mentoringType(MentoringType.INDIVIDUAL)
                .mentorStatus(MentorStatus.ACTIVE)
                .reputationScore(95)
                .completedTasks(12)
                .rating(BigDecimal.valueOf(4.85))
                .reviewCount(15)
                .build();

        sampleExperience = Experience.builder()
                .id(200L)
                .user(sampleUser)
                .title("Tech Lead")
                .company("FPT Software")
                .isCurrent(true)
                .isPrimary(true)
                .startDate(LocalDate.of(2021, 1, 1))
                .build();

        sampleSupportedField = MentorSupportedField.builder()
                .id(300L)
                .mentorProfile(sampleProfile)
                .industry(sampleIndustry)
                .build();

        sampleTopic = MentorTopic.builder()
                .id(400L)
                .mentorProfile(sampleProfile)
                .topicName("Kiến trúc Microservices")
                .build();

        sampleSkill = UserSkill.builder()
                .id(500L)
                .user(sampleUser)
                .groupName("Backend")
                .skillName("Spring Boot")
                .sortOrder((short) 1)
                .build();
    }

    private void mockBatchDependencies() {
        when(userProfileRepository.findAllById(anyList())).thenReturn(List.of(sampleUserProfile));
        when(experienceRepository.findByUserIdIn(anyList())).thenReturn(List.of(sampleExperience));
        when(mentorSupportedFieldRepository.findByMentorProfileIdIn(anyList())).thenReturn(List.of(sampleSupportedField));
        when(mentorTopicRepository.findByMentorProfileIdIn(anyList())).thenReturn(List.of(sampleTopic));
        when(userSkillRepository.findByUserIdIn(anyList())).thenReturn(List.of(sampleSkill));
    }

    @Test
    @DisplayName("TC01 - Không truyền keyword/filter -> Trả danh sách Mentor ACTIVE mặc định")
    void tc01_searchWithoutFilter_returnsActiveMentors() {
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Nguyễn Văn Mentor", response.getContent().get(0).getFullName());
        assertEquals(95, response.getContent().get(0).getReputationScore());
        assertEquals("Tech Lead", response.getContent().get(0).getCurrentPosition());
        assertEquals("FPT Software", response.getContent().get(0).getCurrentCompany());
    }

    @Test
    @DisplayName("TC02 - Search bằng keyword có kết quả -> Trả về Mentor khớp từ khóa")
    void tc02_searchWithKeyword_hasResults() {
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().keyword("Spring Boot").build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertTrue(response.getContent().get(0).getSkills().contains("Spring Boot"));
    }

    @Test
    @DisplayName("TC03 - Search bằng keyword không có kết quả -> Trả page rỗng hợp lệ (không throw lỗi)")
    void tc03_searchWithKeyword_noResults_returnsEmptyPage() {
        Page<MentorProfile> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().keyword("NonExistingKeywordXYZ").build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertTrue(response.getContent().isEmpty());
        assertEquals(0, response.getTotalElements());
        assertEquals(0, response.getTotalPages());
    }

    @Test
    @DisplayName("TC04 - Filter theo Field / Industry -> Truy vấn hợp lệ khi fieldId tồn tại")
    void tc04_filterByFieldIndustry() {
        when(industryRepository.existsById(10L)).thenReturn(true);
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().fieldId(10L).build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Công nghệ thông tin", response.getContent().get(0).getSupportedFields().get(0).getName());
    }

    @Test
    @DisplayName("TC05 - Filter theo Specialization -> Truy vấn hợp lệ khi specializationId tồn tại")
    void tc05_filterBySpecialization() {
        when(majorRepository.existsById(1L)).thenReturn(true);
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().specializationId(1L).build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals("Kỹ thuật phần mềm", response.getContent().get(0).getSpecialization());
    }

    @Test
    @DisplayName("TC06 - Filter theo Skills -> Trả về Mentor sở hữu kỹ năng chỉ định")
    void tc06_filterBySkills() {
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().skill("Spring Boot").build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertTrue(response.getContent().get(0).getSkills().contains("Spring Boot"));
    }

    @Test
    @DisplayName("TC07 - Filter theo Working Mode (ONLINE/OFFLINE/BOTH)")
    void tc07_filterByWorkingMode() {
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().workingMode(MentoringWorkingMode.ONLINE).build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(MentoringWorkingMode.ONLINE, response.getContent().get(0).getWorkingMode());
    }

    @Test
    @DisplayName("TC08 - Filter theo Mentoring Type (INDIVIDUAL/GROUP/BOTH)")
    void tc08_filterByMentoringType() {
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().mentoringType(MentoringType.INDIVIDUAL).build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(MentoringType.INDIVIDUAL, response.getContent().get(0).getMentoringType());
    }

    @Test
    @DisplayName("TC09 - Kết hợp nhiều bộ lọc đồng thời (Field + Working Mode + Mentoring Type)")
    void tc09_combinedFilters() {
        when(industryRepository.existsById(10L)).thenReturn(true);
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder()
                .fieldId(10L)
                .workingMode(MentoringWorkingMode.ONLINE)
                .mentoringType(MentoringType.INDIVIDUAL)
                .build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
    }

    @Test
    @DisplayName("TC10 - Keyword kết hợp nhiều bộ lọc")
    void tc10_keywordPlusCombinedFilters() {
        when(industryRepository.existsById(10L)).thenReturn(true);
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder()
                .keyword("Nguyễn Văn")
                .fieldId(10L)
                .workingMode(MentoringWorkingMode.ONLINE)
                .build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
    }

    @Test
    @DisplayName("TC11 - Mentor INACTIVE không xuất hiện trong kết quả (Specification lọc từ Backend)")
    void tc11_inactiveMentorExcluded() {
        // Mô phỏng Specification loại trừ mentor INACTIVE ngay ở DB query
        Page<MentorProfile> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10));

        assertNotNull(response);
        assertTrue(response.getContent().isEmpty());
    }

    @Test
    @DisplayName("TC12 - Phân trang hoạt động đúng với PageResponse convention")
    void tc12_paginationWorksCorrectly() {
        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(1, 10), 25);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        mockBatchDependencies();

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().build();
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, PageRequest.of(1, 10));

        assertEquals(1, response.getPageNumber());
        assertEquals(10, response.getPageSize());
        assertEquals(25, response.getTotalElements());
        assertEquals(3, response.getTotalPages());
        assertFalse(response.isLast());
    }

    @Test
    @DisplayName("TC13 - Filter value không hợp lệ (Field ID không tồn tại) -> Throw BadRequestException")
    void tc13_invalidFilterValue_throwsBadRequest() {
        when(industryRepository.existsById(999L)).thenReturn(false);

        MentorSearchCriteria criteria = MentorSearchCriteria.builder().fieldId(999L).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                mentorSearchService.searchMentors(criteria, PageRequest.of(0, 10)));

        assertTrue(ex.getMessage().contains("Lĩnh vực chuyên môn không hợp lệ"));
    }

    @Test
    @DisplayName("TC14 - Kích thước trang không hợp lệ (size <= 0 hoặc > 50) -> Throw BadRequestException")
    void tc14_invalidPageSize_throwsBadRequest() {
        MentorSearchCriteria criteria = MentorSearchCriteria.builder().build();
        Pageable mockZeroSizePageable = mock(Pageable.class);
        when(mockZeroSizePageable.getPageSize()).thenReturn(0);

        assertThrows(BadRequestException.class, () ->
                mentorSearchService.searchMentors(criteria, mockZeroSizePageable));

        assertThrows(BadRequestException.class, () ->
                mentorSearchService.searchMentors(criteria, PageRequest.of(0, 100)));
    }

    @Test
    @DisplayName("TC16 - Không có kết quả trả PageResponse rỗng hợp lệ, không trả lỗi hệ thống")
    void tc16_noResults_returnsValidEmptyPageResponse() {
        Page<MentorProfile> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(
                MentorSearchCriteria.builder().build(), PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(0, response.getTotalElements());
        assertTrue(response.getContent().isEmpty());
    }

    @Test
    @DisplayName("TC17 - Mentor có nhiều skills và topics không bị duplicate trong danh sách")
    void tc17_mentorWithMultipleSkills_notDuplicated() {
        UserSkill secondSkill = UserSkill.builder()
                .id(501L)
                .user(sampleUser)
                .groupName("Database")
                .skillName("PostgreSQL")
                .sortOrder((short) 2)
                .build();

        when(userProfileRepository.findAllById(anyList())).thenReturn(List.of(sampleUserProfile));
        when(experienceRepository.findByUserIdIn(anyList())).thenReturn(List.of(sampleExperience));
        when(mentorSupportedFieldRepository.findByMentorProfileIdIn(anyList())).thenReturn(List.of(sampleSupportedField));
        when(mentorTopicRepository.findByMentorProfileIdIn(anyList())).thenReturn(List.of(sampleTopic));
        when(userSkillRepository.findByUserIdIn(anyList())).thenReturn(List.of(sampleSkill, secondSkill));

        Page<MentorProfile> page = new PageImpl<>(List.of(sampleProfile), PageRequest.of(0, 10), 1);
        when(mentorProfileRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(
                MentorSearchCriteria.builder().build(), PageRequest.of(0, 10));

        assertEquals(1, response.getContent().size());
        assertEquals(2, response.getContent().get(0).getSkills().size());
        assertTrue(response.getContent().get(0).getSkills().contains("Spring Boot"));
        assertTrue(response.getContent().get(0).getSkills().contains("PostgreSQL"));
    }

    @Test
    @DisplayName("TC18 - Lấy danh mục tùy chọn bộ lọc động (Filter Options) thành công")
    void tc18_getFilterOptions_success() {
        when(industryRepository.findAll(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(sampleIndustry));
        when(majorRepository.findAll(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(sampleMajor));

        MentorFilterOptionsResponse options = mentorSearchService.getFilterOptions();

        assertNotNull(options);
        assertEquals(1, options.getIndustries().size());
        assertEquals(1, options.getSpecializations().size());
        assertEquals(3, options.getWorkingModes().size());
        assertEquals(3, options.getMentoringTypes().size());
        assertFalse(options.getPopularSkills().isEmpty());
    }
}
