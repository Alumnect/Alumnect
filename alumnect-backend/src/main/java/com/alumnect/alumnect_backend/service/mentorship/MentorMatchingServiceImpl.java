package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lớp triển khai dịch vụ nghiệp vụ tìm kiếm và phân phối Mentor nội bộ (UC100).
 * Matching dựa trên Supported Field, trạng thái hoạt động (ACTIVE), và tính tương thích hình thức hỗ trợ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentorMatchingServiceImpl implements MentorMatchingService {

    private final MentorSupportedFieldRepository mentorSupportedFieldRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;
    private final MentoringRequestDistributionRepository mentoringRequestDistributionRepository;

    /**
     * Tìm danh sách các Mentor ACTIVE đủ điều kiện tiếp nhận yêu cầu dựa trên lĩnh vực ngành nghề và hình thức hỗ trợ.
     * Quy trình:
     * 1. Tra cứu các bản ghi MentorSupportedField theo industryId.
     * 2. Lọc các Mentor có mentorStatus = ACTIVE và tài khoản user có accountStatus = ACTIVE.
     * 3. Kiểm tra tính hợp lệ của gói dịch vụ Mentor (Subscription còn hạn).
     * 4. Kiểm tra tính tương thích về phương thức làm việc (workingMode) và loại hình hỗ trợ (participationType).
     * 5. Khử trùng lặp và trả về danh sách Mentor.
     *
     * @param industryId ID ngành nghề / lĩnh vực cần hỗ trợ
     * @param workingMode Hình thức làm việc của yêu cầu
     * @param participationType Hình thức tham gia
     * @return Danh sách hồ sơ Mentor phù hợp
     */
    @Override
    @Transactional(readOnly = true)
    public List<MentorProfile> findMatchingMentors(Long industryId, MentoringWorkingMode workingMode, MentoringType participationType) {
        log.info("Bắt đầu matching Mentor cho industryId={}, workingMode={}, participationType={}",
                industryId, workingMode, participationType);

        List<MentorSupportedField> supportedFieldRecords = mentorSupportedFieldRepository.findByIndustryId(industryId);
        if (supportedFieldRecords == null || supportedFieldRecords.isEmpty()) {
            log.info("Không tìm thấy bản ghi hỗ trợ ngành nghề nào cho industryId={}", industryId);
            return List.of();
        }

        Instant now = Instant.now();
        Set<Long> processedProfileIds = new HashSet<>();
        List<MentorProfile> matchedMentors = new ArrayList<>();

        for (MentorSupportedField msf : supportedFieldRecords) {
            MentorProfile profile = msf.getMentorProfile();
            if (profile == null || processedProfileIds.contains(profile.getId())) {
                continue;
            }

            // 1. Kiểm tra trạng thái hồ sơ Mentor
            if (profile.getMentorStatus() != MentorStatus.ACTIVE) {
                log.debug("Loại Mentor profileId={} vì mentorStatus={}", profile.getId(), profile.getMentorStatus());
                continue;
            }

            // 2. Kiểm tra trạng thái tài khoản người dùng
            User user = profile.getUser();
            if (user == null || user.getAccountStatus() != AccountStatus.ACTIVE) {
                log.debug("Loại Mentor profileId={} vì tài khoản người dùng không ACTIVE", profile.getId());
                continue;
            }

            // 3. Kiểm tra gói dịch vụ Mentor (Subscription)
            List<MentorSubscription> subscriptions = mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(profile.getId());
            boolean hasValidSubscription = subscriptions.stream()
                    .anyMatch(sub -> (sub.getStatus() == MentorSubscriptionStatus.ACTIVE || sub.getStatus() == MentorSubscriptionStatus.PAID)
                            && (sub.getEndDate() == null || sub.getEndDate().isAfter(now)));

            // Nếu hệ thống quản lý gói subscription, Mentor phải có gói còn hiệu lực
            if (!subscriptions.isEmpty() && !hasValidSubscription) {
                log.debug("Loại Mentor profileId={} vì gói đăng ký đã hết hạn", profile.getId());
                continue;
            }

            // 4. Kiểm tra tính tương thích về phương thức làm việc (workingMode)
            if (!isWorkingModeCompatible(profile.getWorkingMode(), workingMode)) {
                log.debug("Loại Mentor profileId={} do không tương thích workingMode: Mentor={}, Request={}",
                        profile.getId(), profile.getWorkingMode(), workingMode);
                continue;
            }

            // 5. Kiểm tra tính tương thích về loại hình hỗ trợ (participationType / mentoringType)
            if (!isParticipationTypeCompatible(profile.getMentoringType(), participationType)) {
                log.debug("Loại Mentor profileId={} do không tương thích participationType: Mentor={}, Request={}",
                        profile.getId(), profile.getMentoringType(), participationType);
                continue;
            }

            processedProfileIds.add(profile.getId());
            matchedMentors.add(profile);
        }

        log.info("Matching hoàn tất: Tìm thấy {} Mentor phù hợp cho industryId={}", matchedMentors.size(), industryId);
        return matchedMentors;
    }

    /**
     * Phân phối yêu cầu tới các Mentor đã được matching và lưu vết vào bảng mentoring_request_distributions.
     * Cơ chế Idempotent: Kiểm tra existsByRequestIdAndMentorProfileId trước khi tạo bản ghi mới (BR-10).
     *
     * @param request Yêu cầu Mentoring cần phân phối
     * @param matchingMentors Danh sách các Mentor phù hợp
     * @return Số lượng Mentor đã được phân phối thành công
     */
    @Override
    @Transactional
    public int distributeRequestToMentors(MentoringRequest request, List<MentorProfile> matchingMentors) {
        if (matchingMentors == null || matchingMentors.isEmpty()) {
            log.info("Danh sách Mentor matching rỗng, không tạo bản ghi phân phối cho requestId={}", request.getId());
            return 0;
        }

        int distributedCount = 0;
        for (MentorProfile mentor : matchingMentors) {
            // Không phân phối yêu cầu cho chính bản thân người tạo (nếu người tạo cũng là một Mentor)
            if (mentor.getUser() != null && request.getStudent() != null
                    && mentor.getUser().getId().equals(request.getStudent().getId())) {
                log.debug("Bỏ qua phân phối requestId={} tới chính người tạo (mentorProfileId={})", request.getId(), mentor.getId());
                continue;
            }

            boolean alreadyDistributed = mentoringRequestDistributionRepository.existsByRequestIdAndMentorProfileId(
                    request.getId(), mentor.getId()
            );

            if (!alreadyDistributed) {
                MentoringRequestDistribution distribution = MentoringRequestDistribution.builder()
                        .request(request)
                        .mentorProfile(mentor)
                        .status(MentoringDistributionStatus.PENDING)
                        .distributedAt(Instant.now())
                        .build();

                mentoringRequestDistributionRepository.save(distribution);
                distributedCount++;
                log.info("Đã phân phối requestId={} tới mentorProfileId={}", request.getId(), mentor.getId());
            } else {
                log.debug("Bỏ qua phân phối trùng lặp requestId={} tới mentorProfileId={}", request.getId(), mentor.getId());
            }
        }

        return distributedCount;
    }

    /**
     * Kiểm tra tính tương thích giữa hình thức làm việc của Mentor và yêu cầu của người học.
     */
    private boolean isWorkingModeCompatible(MentoringWorkingMode mentorMode, MentoringWorkingMode requestMode) {
        if (mentorMode == null || requestMode == null) {
            return true;
        }
        if (mentorMode == MentoringWorkingMode.BOTH || requestMode == MentoringWorkingMode.BOTH) {
            return true;
        }
        return mentorMode == requestMode;
    }

    /**
     * Kiểm tra tính tương thích giữa loại hình cố vấn của Mentor và hình thức tham gia của người học.
     */
    private boolean isParticipationTypeCompatible(MentoringType mentorType, MentoringType requestType) {
        if (mentorType == null || requestType == null) {
            return true;
        }
        if (mentorType == MentoringType.BOTH || requestType == MentoringType.BOTH) {
            return true;
        }
        return mentorType == requestType;
    }
}
