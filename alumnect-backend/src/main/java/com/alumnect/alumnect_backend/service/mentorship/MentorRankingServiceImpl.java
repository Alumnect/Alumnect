package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRankingResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi nghiệp vụ Xem bảng xếp hạng Mentor theo lĩnh vực chuyên môn (UC97).
 * Áp dụng thuật toán xếp hạng xác định (Deterministic Ranking Algorithm), kiểm tra tư cách hợp lệ (Eligibility)
 * và tối ưu hóa truy vấn cơ sở dữ liệu để loại bỏ bài toán N+1 query.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorRankingServiceImpl implements MentorRankingService {

    private final IndustryRepository industryRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;

    /**
     * Lấy danh sách bảng xếp hạng Mentor theo lĩnh vực chuyên môn có phân trang.
     * Thứ hạng (rank) được tính toàn cục theo phân trang: rank = (page * size) + index + 1.
     *
     * @param fieldId ID của lĩnh vực chuyên môn (ngành nghề / Industry)
     * @param pageable Đối tượng phân trang (page, size)
     * @return Đối tượng PageResponse chứa danh sách MentorRankingResponse kèm metadata phân trang
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentorRankingResponse> getMentorRanking(Long fieldId, Pageable pageable) {
        log.info("Bắt đầu truy vấn bảng xếp hạng Mentor cho fieldId={}, page={}, size={}",
                fieldId, pageable.getPageNumber(), pageable.getPageSize());

        // 1. Kiểm tra tính tồn tại của lĩnh vực chuyên môn (Industry / Field)
        Industry industry = industryRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lĩnh vực chuyên môn với ID: " + fieldId));

        // 2. Truy vấn danh sách Mentor đủ điều kiện xếp hạng trong lĩnh vực này
        Instant now = Instant.now();
        Page<MentorProfile> rankedPage = mentorProfileRepository.findRankedMentorsByField(fieldId, now, pageable);

        if (rankedPage.isEmpty()) {
            log.info("Lĩnh vực '{}' (fieldId={}) hiện chưa có Mentor ACTIVE đủ điều kiện.", industry.getName(), fieldId);
            return PageResponse.<MentorRankingResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(rankedPage.getNumber())
                    .pageSize(rankedPage.getSize())
                    .totalElements(rankedPage.getTotalElements())
                    .totalPages(rankedPage.getTotalPages())
                    .last(rankedPage.isLast())
                    .build();
        }

        // 3. Batch fetch UserProfile và Experience để tối ưu hiệu năng (tránh N+1 query)
        List<Long> userIds = rankedPage.getContent().stream()
                .map(mp -> mp.getUser().getId())
                .distinct()
                .collect(Collectors.toList());

        Map<Long, UserProfile> userProfileMap = userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p, (existing, replacement) -> existing));

        Map<Long, List<Experience>> userExperienceMap = experienceRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.groupingBy(exp -> exp.getUser().getId()));

        // 4. Ánh xạ dữ liệu sang Response DTO và gán thứ hạng toàn cục
        int baseRank = pageable.getPageNumber() * pageable.getPageSize();
        List<MentorRankingResponse> rankingResponses = new ArrayList<>();

        for (int i = 0; i < rankedPage.getContent().size(); i++) {
            MentorProfile profile = rankedPage.getContent().get(i);
            Long userId = profile.getUser().getId();
            UserProfile userProfile = userProfileMap.get(userId);
            List<Experience> userExps = userExperienceMap.getOrDefault(userId, Collections.emptyList());

            // Xác định công việc hiện tại tiêu biểu (ưu tiên isCurrent -> isPrimary -> mới nhất)
            Experience currentExp = resolveCurrentExperience(userExps);

            String currentPosition = currentExp != null ? currentExp.getTitle() : null;
            String currentCompany = currentExp != null ? currentExp.getCompany() : null;

            int globalRank = baseRank + i + 1;

            MentorRankingResponse item = MentorRankingResponse.builder()
                    .rank(globalRank)
                    .mentorId(profile.getId())
                    .userId(userId)
                    .fullName(userProfile != null ? userProfile.getFullName() : profile.getUser().getEmail())
                    .avatarUrl(userProfile != null ? userProfile.getAvatarUrl() : null)
                    .headline(userProfile != null ? userProfile.getHeadline() : null)
                    .currentCompany(currentCompany)
                    .currentPosition(currentPosition)
                    .fieldId(industry.getId())
                    .fieldName(industry.getName())
                    .reputationScore(profile.getReputationScore() != null ? profile.getReputationScore() : 0)
                    .completedTasks(profile.getCompletedTasks() != null ? profile.getCompletedTasks() : 0)
                    .rating(profile.getRating() != null ? profile.getRating() : java.math.BigDecimal.ZERO)
                    .reviewCount(profile.getReviewCount() != null ? profile.getReviewCount() : 0)
                    .build();

            rankingResponses.add(item);
        }

        log.info("Truy vấn thành công bảng xếp hạng Mentor cho fieldId={}, số phần tử trả về={}/{}",
                fieldId, rankingResponses.size(), rankedPage.getTotalElements());

        return PageResponse.<MentorRankingResponse>builder()
                .content(rankingResponses)
                .pageNumber(rankedPage.getNumber())
                .pageSize(rankedPage.getSize())
                .totalElements(rankedPage.getTotalElements())
                .totalPages(rankedPage.getTotalPages())
                .last(rankedPage.isLast())
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

        // 1. Tìm kinh nghiệm đang làm hiện tại
        for (Experience exp : experiences) {
            if (exp.isCurrent()) {
                return exp;
            }
        }

        // 2. Tìm kinh nghiệm chính
        for (Experience exp : experiences) {
            if (exp.isPrimary()) {
                return exp;
            }
        }

        // 3. Lấy kinh nghiệm có startDate mới nhất
        return experiences.stream()
                .filter(e -> e.getStartDate() != null)
                .max(Comparator.comparing(Experience::getStartDate))
                .orElse(experiences.get(0));
    }
}
