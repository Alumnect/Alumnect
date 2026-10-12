package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorDetailResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.MentorTopic;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ Xem chi tiết Mentor (UC99 — View Mentor Detail).
 * Thực hiện truy xuất, tổng hợp thông tin công khai từ hồ sơ cố vấn và hồ sơ người dùng,
 * tính toán tính khả dụng nhận yêu cầu cố vấn (Request Availability) và đảm bảo an toàn dữ liệu.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorDetailServiceImpl implements MentorDetailService {

    private final MentorProfileRepository mentorProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final MentorSupportedFieldRepository mentorSupportedFieldRepository;
    private final MentorTopicRepository mentorTopicRepository;
    private final UserSkillRepository userSkillRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;

    /**
     * Lấy thông tin chi tiết công khai của một Mentor theo định danh hợp lệ.
     * Quy tắc tìm kiếm:
     * 1. Ưu tiên tìm kiếm theo mentor_profiles.id.
     * 2. Nếu không tìm thấy, fallback tìm kiếm theo users.id (đảm bảo tích hợp mượt mà giữa các module).
     * 3. Ném ResourceNotFoundException nếu không tìm thấy bản ghi Mentor nào tương ứng.
     *
     * @param identifier Định danh của Mentor (mentorProfileId hoặc userId)
     * @return DTO chứa thông tin chi tiết đầy đủ của Mentor
     */
    @Override
    @Transactional(readOnly = true)
    public MentorDetailResponse getMentorDetail(Long identifier) {
        log.info("Bắt đầu truy xuất thông tin chi tiết Mentor với identifier={}", identifier);

        if (identifier == null || identifier <= 0) {
            throw new BadRequestException("Định danh Mentor không hợp lệ (phải là số nguyên dương)");
        }

        // 1. Tìm hồ sơ Mentor: Thử tìm theo mentorProfileId trước, nếu không có thì thử theo userId
        Optional<MentorProfile> profileOpt = mentorProfileRepository.findById(identifier);
        if (profileOpt.isEmpty()) {
            profileOpt = mentorProfileRepository.findByUserId(identifier);
        }

        MentorProfile mentorProfile = profileOpt.orElseThrow(() -> {
            log.warn("Không tìm thấy hồ sơ Mentor với identifier={}", identifier);
            return new ResourceNotFoundException("Không tìm thấy thông tin Mentor với định danh: " + identifier);
        });

        User user = mentorProfile.getUser();
        Long userId = user.getId();
        Long mentorProfileId = mentorProfile.getId();

        // 2. Truy xuất hồ sơ người dùng (UserProfile)
        UserProfile userProfile = userProfileRepository.findById(userId).orElse(null);

        // 3. Truy xuất kinh nghiệm làm việc (Experience)
        List<Experience> experiences = experienceRepository.findByUserIdOrderByStartDateDesc(userId);

        // 4. Truy xuất lĩnh vực hỗ trợ (MentorSupportedField)
        List<MentorSupportedField> supportedFields = mentorSupportedFieldRepository.findByMentorProfileId(mentorProfileId);

        // 5. Truy xuất các chủ đề cố vấn (MentorTopic)
        List<MentorTopic> topics = mentorTopicRepository.findByMentorProfileId(mentorProfileId);

        // 6. Truy xuất kỹ năng chuyên môn (UserSkill)
        List<UserSkill> skills = userSkillRepository.findByUserIdOrderBySortOrderAscSkillNameAsc(userId);

        // 7. Xác định vị trí và công ty hiện tại tiêu biểu (tái sử dụng từ UC98/UC97)
        Experience currentExp = resolveCurrentExperience(experiences);
        String currentPosition = currentExp != null ? currentExp.getTitle() : null;
        String currentCompany = currentExp != null ? currentExp.getCompany() : null;

        // 8. Đánh giá tính khả dụng nhận yêu cầu cố vấn (canReceiveRequest & availabilityReason)
        Instant now = Instant.now();
        boolean isMentorActive = mentorProfile.getMentorStatus() == MentorStatus.ACTIVE;
        boolean isUserActive = user.getAccountStatus() == AccountStatus.ACTIVE;

        List<MentorSubscription> subscriptions = mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(mentorProfileId);
        boolean hasActiveSubscription = subscriptions.stream()
                .anyMatch(sub -> (sub.getStatus() == MentorSubscriptionStatus.ACTIVE || sub.getStatus() == MentorSubscriptionStatus.PAID)
                        && sub.getEndDate() != null
                        && sub.getEndDate().isAfter(now));

        boolean canReceiveRequest = isMentorActive && isUserActive && hasActiveSubscription;
        String availabilityReason = resolveAvailabilityReason(canReceiveRequest, isUserActive, mentorProfile.getMentorStatus(), hasActiveSubscription);

        // 9. Ánh xạ thông tin học vấn (Academic Information)
        MentorDetailResponse.AcademicInfo academicInfo = null;
        if (userProfile != null) {
            academicInfo = MentorDetailResponse.AcademicInfo.builder()
                    .campus(userProfile.getCampus())
                    .majorName(userProfile.getMajor() != null ? userProfile.getMajor().getName() : null)
                    .majorCode(userProfile.getMajor() != null ? userProfile.getMajor().getCode() : null)
                    .cohort(userProfile.getCohort())
                    .graduationYear(userProfile.getGraduationYear())
                    .build();
        }

        // 10. Ánh xạ danh sách lĩnh vực hỗ trợ
        List<MentorDetailResponse.SupportedFieldItem> supportedFieldItems = supportedFields.stream()
                .map(f -> MentorDetailResponse.SupportedFieldItem.builder()
                        .id(f.getIndustry().getId())
                        .name(f.getIndustry().getName())
                        .build())
                .collect(Collectors.toList());

        // 11. Ánh xạ danh sách chủ đề cố vấn
        List<String> topicNames = topics.stream()
                .map(MentorTopic::getTopicName)
                .distinct()
                .collect(Collectors.toList());

        // 12. Ánh xạ danh sách kỹ năng chuyên môn
        List<MentorDetailResponse.SkillItem> skillItems = skills.stream()
                .map(s -> MentorDetailResponse.SkillItem.builder()
                        .id(s.getId())
                        .skillName(s.getSkillName())
                        .groupName(s.getGroupName())
                        .sortOrder(s.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        // 13. Ánh xạ lịch sử kinh nghiệm làm việc (Career Timeline)
        List<MentorDetailResponse.ExperienceItem> experienceItems = experiences.stream()
                .map(e -> MentorDetailResponse.ExperienceItem.builder()
                        .id(e.getId())
                        .title(e.getTitle())
                        .company(e.getCompany())
                        .location(e.getLocation())
                        .locationCity(e.getLocationCity())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .isCurrent(e.isCurrent())
                        .isPrimary(e.isPrimary())
                        .description(e.getDescription())
                        .build())
                .collect(Collectors.toList());

        // 14. Tổng hợp Response DTO hoàn chỉnh
        MentorDetailResponse response = MentorDetailResponse.builder()
                .mentorId(mentorProfileId)
                .userId(userId)
                .fullName(userProfile != null ? userProfile.getFullName() : user.getEmail())
                .avatarUrl(userProfile != null ? userProfile.getAvatarUrl() : null)
                .headline(userProfile != null ? userProfile.getHeadline() : null)
                .currentPosition(currentPosition)
                .currentCompany(currentCompany)
                .mentorStatus(mentorProfile.getMentorStatus())
                .isVerifiedAlumni(user.isAccountVerified())
                .canReceiveRequest(canReceiveRequest)
                .availabilityReason(availabilityReason)
                .academicInfo(academicInfo)
                .bio(mentorProfile.getBio())
                .biography(userProfile != null ? userProfile.getBiography() : null)
                .city(userProfile != null ? userProfile.getCity() : null)
                .workingMode(mentorProfile.getWorkingMode())
                .mentoringType(mentorProfile.getMentoringType())
                .supportedFields(supportedFieldItems)
                .topics(topicNames)
                .skills(skillItems)
                .experiences(experienceItems)
                .reputationScore(mentorProfile.getReputationScore() != null ? mentorProfile.getReputationScore() : 0)
                .rating(mentorProfile.getRating() != null ? mentorProfile.getRating() : BigDecimal.ZERO)
                .reviewCount(mentorProfile.getReviewCount() != null ? mentorProfile.getReviewCount() : 0)
                .completedTasks(mentorProfile.getCompletedTasks() != null ? mentorProfile.getCompletedTasks() : 0)
                .build();

        log.info("Truy xuất chi tiết Mentor thành công: mentorProfileId={}, userId={}, canReceiveRequest={}",
                mentorProfileId, userId, canReceiveRequest);

        return response;
    }

    /**
     * Xác định công việc / kinh nghiệm hiện tại tiêu biểu của người dùng.
     * Quy tắc ưu tiên:
     * 1. isCurrent = true
     * 2. isPrimary = true
     * 3. startDate gần nhất
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

    /**
     * Xác định thông điệp giải thích lý do không thể nhận yêu cầu cố vấn.
     */
    private String resolveAvailabilityReason(boolean canReceiveRequest, boolean isUserActive, MentorStatus status, boolean hasActiveSub) {
        if (canReceiveRequest) {
            return null;
        }
        if (!isUserActive) {
            return "Tài khoản của Mentor hiện không trong trạng thái hoạt động.";
        }
        if (status == MentorStatus.EXPIRED || (!hasActiveSub && (status == MentorStatus.ACTIVE || status == MentorStatus.PAYMENT_PENDING))) {
            return "Gói hoạt động của Mentor đã hết hạn hoặc chưa được gia hạn, tạm thời không thể tiếp nhận yêu cầu mới.";
        }
        if (status == MentorStatus.PAYMENT_PENDING) {
            return "Hồ sơ Mentor đang chờ hoàn tất thanh toán kích hoạt gói dịch vụ.";
        }
        if (status == MentorStatus.INCOMPLETE) {
            return "Hồ sơ Mentor chưa hoàn tất thiết lập thông tin.";
        }
        return "Mentor hiện chưa sẵn sàng tiếp nhận yêu cầu cố vấn mới.";
    }
}
