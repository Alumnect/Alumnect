package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Lớp dịch vụ thực thi đánh giá điều kiện và tính toán lại trạng thái Mentor (Mentor Eligibility).
 * Tái sử dụng trực tiếp các quy tắc thẩm định từ UC91 và UC90, đảm bảo tính nhất quán trên toàn hệ thống.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorEligibilityServiceImpl implements MentorEligibilityService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;
    private final MentorRegistrationService mentorRegistrationService;
    private final MentoringTermsService mentoringTermsService;

    /**
     * Tính toán lại và cập nhật trạng thái Mentor của hồ sơ.
     * Mentor ACTIVE chỉ khi:
     * 1. Hồ sơ Mentor bắt buộc hoàn tất (theo UC91).
     * 2. Đã chấp nhận Điều khoản Hướng dẫn & Hỗ trợ hiện hành (theo UC90).
     * 3. Có Mentor Subscription đang hoạt động (ACTIVE hoặc PAID) và chưa hết hạn (endDate > now()).
     *
     * @param mentorProfileId ID hồ sơ Mentor cần tính toán
     * @return Trạng thái MentorStatus mới sau khi đánh giá
     */
    @Override
    @Transactional
    public MentorStatus recalculateMentorStatus(Long mentorProfileId) {
        log.info("Bắt đầu tính toán lại trạng thái Mentor cho mentorProfileId={}", mentorProfileId);

        MentorProfile profile = mentorProfileRepository.findById(mentorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + mentorProfileId));

        String userEmail = profile.getUser().getEmail();

        // 1. Kiểm tra tính hoàn thiện của hồ sơ cá nhân/nghề nghiệp/ngân hàng (tái sử dụng từ UC91)
        boolean isProfileComplete = mentorRegistrationService.isMentorProfileComplete(userEmail);

        // 2. Kiểm tra việc chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (tái sử dụng từ UC90)
        MentoringTermsStatusResponse termsStatus = mentoringTermsService.getCurrentTermsStatus(userEmail);
        boolean termsAccepted = termsStatus != null && termsStatus.isAccepted();

        // 3. Kiểm tra tính hợp lệ của gói Subscription
        List<MentorSubscription> subscriptions = mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(mentorProfileId);
        Instant now = Instant.now();

        boolean hasActiveSubscription = subscriptions.stream()
                .anyMatch(sub -> (sub.getStatus() == MentorSubscriptionStatus.ACTIVE || sub.getStatus() == MentorSubscriptionStatus.PAID)
                        && sub.getEndDate() != null
                        && sub.getEndDate().isAfter(now));

        boolean hadExpiredSubscription = subscriptions.stream()
                .anyMatch(sub -> (sub.getStatus() == MentorSubscriptionStatus.ACTIVE || sub.getStatus() == MentorSubscriptionStatus.PAID || sub.getStatus() == MentorSubscriptionStatus.EXPIRED)
                        && sub.getEndDate() != null
                        && !sub.getEndDate().isAfter(now));

        MentorStatus newStatus;
        if (isProfileComplete && termsAccepted && hasActiveSubscription) {
            newStatus = MentorStatus.ACTIVE;
        } else if (hadExpiredSubscription && !hasActiveSubscription) {
            newStatus = MentorStatus.EXPIRED;
        } else if (isProfileComplete && termsAccepted) {
            newStatus = MentorStatus.PAYMENT_PENDING;
        } else {
            newStatus = MentorStatus.INCOMPLETE;
        }

        log.info("Kết quả đánh giá Mentor profileId={}: isProfileComplete={}, termsAccepted={}, hasActiveSub={} -> newStatus={}",
                mentorProfileId, isProfileComplete, termsAccepted, hasActiveSubscription, newStatus);

        profile.setMentorStatus(newStatus);
        mentorProfileRepository.save(profile);

        return newStatus;
    }
}
