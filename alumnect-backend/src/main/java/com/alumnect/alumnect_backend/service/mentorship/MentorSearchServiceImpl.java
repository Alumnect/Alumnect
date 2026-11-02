package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
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
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.specification.mentorship.MentorSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ Tìm kiếm & Lọc Mentor (UC98).
 * Thực thi các quy tắc kiểm duyệt dữ liệu, truy vấn động thông qua JPA Specification,
 * áp dụng cơ chế Batch Fetching để loại bỏ hoàn toàn vấn đề N+1 query và đảm bảo phân trang chuẩn xác.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorSearchServiceImpl implements MentorSearchService {

    private final MentorProfileRepository mentorProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final MentorSupportedFieldRepository mentorSupportedFieldRepository;
    private final MentorTopicRepository mentorTopicRepository;
    private final UserSkillRepository userSkillRepository;
    private final IndustryRepository industryRepository;
    private final MajorRepository majorRepository;

    /**
     * Tìm kiếm và lọc danh sách Mentor đủ điều kiện hoạt động với phân trang.
     *
     * @param criteria Tiêu chí tìm kiếm và bộ lọc từ Client
     * @param pageable Tham số phân trang (trang hiện tại, kích thước trang, sắp xếp)
     * @return Đối tượng PageResponse chứa danh sách MentorCardResponse kèm metadata phân trang
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentorCardResponse> searchMentors(MentorSearchCriteria criteria, Pageable pageable) {
        log.info("Bắt đầu tìm kiếm & lọc Mentor: criteria={}, page={}, size={}",
                criteria, pageable.getPageNumber(), pageable.getPageSize());

        // 1. Kiểm tra tính hợp lệ của tham số phân trang
        if (pageable.getPageSize() <= 0 || pageable.getPageSize() > 50) {
            throw new BadRequestException("Kích thước trang không hợp lệ (cho phép từ 1 đến 50)");
        }
        if (pageable.getPageNumber() < 0) {
            throw new BadRequestException("Chỉ số trang không hợp lệ (phải >= 0)");
        }

        // 2. Kiểm tra tính hợp lệ của các bộ lọc ID nếu có
        if (criteria.getFieldId() != null && criteria.getFieldId() > 0) {
            if (!industryRepository.existsById(criteria.getFieldId())) {
                throw new BadRequestException("Lĩnh vực chuyên môn không hợp lệ hoặc không tồn tại");
            }
        }
        if (criteria.getSpecializationId() != null && criteria.getSpecializationId() > 0) {
            if (!majorRepository.existsById(criteria.getSpecializationId())) {
                throw new BadRequestException("Chuyên ngành học không hợp lệ hoặc không tồn tại");
            }
        }

        // 3. Khởi tạo Specification và truy vấn dữ liệu từ DB
        Instant now = Instant.now();
        Specification<MentorProfile> spec = MentorSpecification.filterMentors(criteria, now);
        Page<MentorProfile> profilePage = mentorProfileRepository.findAll(spec, pageable);

        if (profilePage.isEmpty()) {
            log.info("Không tìm thấy Mentor nào thỏa mãn tiêu chí tìm kiếm.");
            return PageResponse.<MentorCardResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(profilePage.getNumber())
                    .pageSize(profilePage.getSize())
                    .totalElements(profilePage.getTotalElements())
                    .totalPages(profilePage.getTotalPages())
                    .last(profilePage.isLast())
                    .build();
        }

        // 4. Batch Fetching dữ liệu liên quan để tối ưu hóa hiệu năng, loại bỏ N+1 query
        List<MentorProfile> profiles = profilePage.getContent();
        List<Long> mentorProfileIds = profiles.stream().map(MentorProfile::getId).toList();
        List<Long> userIds = profiles.stream().map(p -> p.getUser().getId()).distinct().toList();

        // 4.1. Nạp hồ sơ người dùng (UserProfile)
        Map<Long, UserProfile> userProfileMap = userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p, (existing, replacement) -> existing));

        // 4.2. Nạp kinh nghiệm làm việc (Experience)
        Map<Long, List<Experience>> experienceMap = experienceRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.groupingBy(exp -> exp.getUser().getId()));

        // 4.3. Nạp danh sách lĩnh vực hỗ trợ (MentorSupportedField)
        Map<Long, List<MentorSupportedField>> fieldMap = mentorSupportedFieldRepository.findByMentorProfileIdIn(mentorProfileIds).stream()
                .collect(Collectors.groupingBy(f -> f.getMentorProfile().getId()));

        // 4.4. Nạp danh sách chủ đề cố vấn (MentorTopic)
        Map<Long, List<MentorTopic>> topicMap = mentorTopicRepository.findByMentorProfileIdIn(mentorProfileIds).stream()
                .collect(Collectors.groupingBy(t -> t.getMentorProfile().getId()));

        // 4.5. Nạp danh sách kỹ năng người dùng (UserSkill)
        Map<Long, List<UserSkill>> skillMap = userSkillRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));

        // 5. Ánh xạ dữ liệu sang danh sách DTO phản hồi
        List<MentorCardResponse> cardResponses = new ArrayList<>();

        for (MentorProfile profile : profiles) {
            Long userId = profile.getUser().getId();
            UserProfile userProfile = userProfileMap.get(userId);
            List<Experience> userExps = experienceMap.getOrDefault(userId, Collections.emptyList());
            List<MentorSupportedField> userFields = fieldMap.getOrDefault(profile.getId(), Collections.emptyList());
            List<MentorTopic> userTopics = topicMap.getOrDefault(profile.getId(), Collections.emptyList());
            List<UserSkill> userSkills = skillMap.getOrDefault(userId, Collections.emptyList());

            // Xác định chức danh và công ty hiện tại (ưu tiên isCurrent -> isPrimary -> startDate DESC)
            Experience currentExp = resolveCurrentExperience(userExps);
            String currentPosition = currentExp != null ? currentExp.getTitle() : null;
            String currentCompany = currentExp != null ? currentExp.getCompany() : null;

            // Xử lý danh sách lĩnh vực hỗ trợ
            List<MentorCardResponse.SupportedFieldItem> supportedFieldItems = userFields.stream()
                    .map(f -> MentorCardResponse.SupportedFieldItem.builder()
                            .id(f.getIndustry().getId())
                            .name(f.getIndustry().getName())
                            .build())
                    .collect(Collectors.toList());

            // Xử lý danh sách chủ đề cố vấn
            List<String> topicNames = userTopics.stream()
                    .map(MentorTopic::getTopicName)
                    .distinct()
                    .collect(Collectors.toList());

            // Xử lý danh sách kỹ năng chuyên môn
            List<String> skillNames = userSkills.stream()
                    .sorted(Comparator.comparing(UserSkill::getSortOrder).thenComparing(UserSkill::getSkillName))
                    .map(UserSkill::getSkillName)
                    .distinct()
                    .collect(Collectors.toList());

            // Thông tin chuyên ngành học
            String majorName = (userProfile != null && userProfile.getMajor() != null) ? userProfile.getMajor().getName() : null;
            String majorCode = (userProfile != null && userProfile.getMajor() != null) ? userProfile.getMajor().getCode() : null;
            Long majorId = (userProfile != null && userProfile.getMajor() != null) ? userProfile.getMajor().getId() : null;

            MentorCardResponse card = MentorCardResponse.builder()
                    .mentorId(profile.getId())
                    .userId(userId)
                    .fullName(userProfile != null ? userProfile.getFullName() : profile.getUser().getEmail())
                    .avatarUrl(userProfile != null ? userProfile.getAvatarUrl() : null)
                    .headline(userProfile != null ? userProfile.getHeadline() : null)
                    .bio(profile.getBio())
                    .currentPosition(currentPosition)
                    .currentCompany(currentCompany)
                    .specialization(majorName)
                    .majorCode(majorCode)
                    .majorId(majorId)
                    .workingMode(profile.getWorkingMode())
                    .mentoringType(profile.getMentoringType())
                    .supportedFields(supportedFieldItems)
                    .topics(topicNames)
                    .skills(skillNames)
                    .reputationScore(profile.getReputationScore() != null ? profile.getReputationScore() : 0)
                    .rating(profile.getRating() != null ? profile.getRating() : BigDecimal.ZERO)
                    .reviewCount(profile.getReviewCount() != null ? profile.getReviewCount() : 0)
                    .completedTasks(profile.getCompletedTasks() != null ? profile.getCompletedTasks() : 0)
                    .build();

            cardResponses.add(card);
        }

        log.info("Tìm kiếm thành công: số kết quả trả về={}/{}", cardResponses.size(), profilePage.getTotalElements());

        return PageResponse.<MentorCardResponse>builder()
                .content(cardResponses)
                .pageNumber(profilePage.getNumber())
                .pageSize(profilePage.getSize())
                .totalElements(profilePage.getTotalElements())
                .totalPages(profilePage.getTotalPages())
                .last(profilePage.isLast())
                .build();
    }

    /**
     * Lấy danh mục các tùy chọn bộ lọc động phục vụ giao diện người dùng.
     *
     * @return Đối tượng MentorFilterOptionsResponse
     */
    @Override
    @Transactional(readOnly = true)
    public MentorFilterOptionsResponse getFilterOptions() {
        log.info("Lấy danh mục các tùy chọn bộ lọc Mentor (Filter Options).");

        // 1. Danh sách các ngành nghề (Industries)
        List<Industry> allIndustries = industryRepository.findAll(Sort.by("name").ascending());
        List<MentorFilterOptionsResponse.FilterOptionItem> industryItems = allIndustries.stream()
                .map(i -> MentorFilterOptionsResponse.FilterOptionItem.builder()
                        .id(i.getId())
                        .name(i.getName())
                        .build())
                .collect(Collectors.toList());

        // 2. Danh sách các chuyên ngành đào tạo (Majors / Specializations)
        List<Major> allMajors = majorRepository.findAll(Sort.by("name").ascending());
        List<MentorFilterOptionsResponse.SpecializationOptionItem> majorItems = allMajors.stream()
                .map(m -> MentorFilterOptionsResponse.SpecializationOptionItem.builder()
                        .id(m.getId())
                        .code(m.getCode())
                        .name(m.getName())
                        .build())
                .collect(Collectors.toList());

        // 3. Tùy chọn hình thức hướng dẫn (Working Modes)
        List<MentorFilterOptionsResponse.EnumOptionItem> workingModes = List.of(
                MentorFilterOptionsResponse.EnumOptionItem.builder()
                        .value(MentoringWorkingMode.ONLINE.name())
                        .label("Trực tuyến (Online)")
                        .build(),
                MentorFilterOptionsResponse.EnumOptionItem.builder()
                        .value(MentoringWorkingMode.OFFLINE.name())
                        .label("Trực tiếp (Offline)")
                        .build(),
                MentorFilterOptionsResponse.EnumOptionItem.builder()
                        .value(MentoringWorkingMode.BOTH.name())
                        .label("Cả hai hình thức (Online & Offline)")
                        .build()
        );

        // 4. Tùy chọn loại hình cố vấn (Mentoring Types)
        List<MentorFilterOptionsResponse.EnumOptionItem> mentoringTypes = List.of(
                MentorFilterOptionsResponse.EnumOptionItem.builder()
                        .value(MentoringType.INDIVIDUAL.name())
                        .label("Cố vấn 1-1 (Individual)")
                        .build(),
                MentorFilterOptionsResponse.EnumOptionItem.builder()
                        .value(MentoringType.GROUP.name())
                        .label("Cố vấn nhóm (Group)")
                        .build(),
                MentorFilterOptionsResponse.EnumOptionItem.builder()
                        .value(MentoringType.BOTH.name())
                        .label("Cả hai loại hình (1-1 & Nhóm)")
                        .build()
        );

        // 5. Danh sách kỹ năng phổ biến
        List<String> popularSkills = List.of(
                "Java", "Spring Boot", "React", "TypeScript", "Node.js", "Python",
                "Machine Learning", "System Design", "DevOps", "Docker", "Kubernetes",
                "Product Management", "UI/UX Design", "Data Analysis", "Agile/Scrum"
        );

        return MentorFilterOptionsResponse.builder()
                .industries(industryItems)
                .specializations(majorItems)
                .workingModes(workingModes)
                .mentoringTypes(mentoringTypes)
                .popularSkills(popularSkills)
                .build();
    }

    /**
     * Xác định kinh nghiệm làm việc tiêu biểu của người dùng.
     * Quy tắc ưu tiên:
     * 1. Kinh nghiệm đang làm việc (isCurrent = true).
     * 2. Kinh nghiệm chính (isPrimary = true).
     * 3. Kinh nghiệm có ngày bắt đầu gần nhất (startDate DESC).
     */
    private Experience resolveCurrentExperience(List<Experience> experiences) {
        if (experiences == null || experiences.isEmpty()) {
            return null;
        }

        for (Experience exp : experiences) {
            if (exp.isCurrent()) {
                return exp;
            }
        }

        for (Experience exp : experiences) {
            if (exp.isPrimary()) {
                return exp;
            }
        }

        return experiences.stream()
                .filter(e -> e.getStartDate() != null)
                .max(Comparator.comparing(Experience::getStartDate))
                .orElse(experiences.get(0));
    }
}
