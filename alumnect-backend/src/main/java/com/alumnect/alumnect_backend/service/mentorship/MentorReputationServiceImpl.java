package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorReviewRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorReviewRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorReviewResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorReview;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service thực thi quy chế tính điểm uy tín và đánh giá Mentor.
 * Công thức: Reputation Score = (Base + S_reviews + S_bonus) - S_penalty
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorReputationServiceImpl implements MentorReputationService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorReviewRepository mentorReviewRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Tính toán điểm nền tảng hồ sơ ban đầu (Base Score).
     * +50 điểm: Xác thực cựu sinh viên (Alumni Verification).
     * +10 điểm: Đầy đủ hồ sơ năng lực (Bio, CV, công ty...).
     */
    @Override
    @Transactional(readOnly = true)
    public int calculateBaseScore(Long mentorProfileId) {
        MentorProfile profile = mentorProfileRepository.findById(mentorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + mentorProfileId));

        int base = 0;
        User user = profile.getUser();
        if (user != null && (user.isAccountVerified() || user.isEmailVerified())) {
            base += 50;
        }

        boolean hasBio = profile.getBio() != null && !profile.getBio().isBlank();
        boolean hasCv = profile.getCvFileKey() != null && !profile.getCvFileKey().isBlank();
        if (hasBio && hasCv) {
            base += 10;
        }

        return base;
    }

    /**
     * Khởi tạo điểm nền tảng khi Mentor được kích hoạt ACTIVE.
     */
    @Override
    @Transactional
    public void initializeBaseScore(MentorProfile profile) {
        if (profile == null) return;
        if (profile.getReputationScore() == null || profile.getReputationScore() == 0) {
            int base = calculateBaseScore(profile.getId());
            profile.setReputationScore(Math.max(50, base)); // Tối thiểu 50 điểm khởi đầu
            profile.setRating(BigDecimal.valueOf(5.00));
            profile.setReviewCount(0);
            profile.setCompletedTasks(0);
            mentorProfileRepository.save(profile);
            log.info("Khởi tạo điểm nền tảng thành công cho Mentor profileId={}: score={}", profile.getId(), profile.getReputationScore());
        }
    }

    /**
     * Học viên gửi đánh giá cho Mentor (1 - 5 sao).
     */
    @Override
    @Transactional
    public MentorReviewResponse submitMentorReview(String studentEmail, MentorReviewRequest request) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản sinh viên: " + studentEmail));

        MentorProfile mentorProfile = mentorProfileRepository.findById(request.getMentorProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + request.getMentorProfileId()));

        // 1. Chống tự đánh giá bản thân
        if (mentorProfile.getUser().getId().equals(student.getId())) {
            throw new BadRequestException("Mentor không thể tự đánh giá chính mình.");
        }

        // 2. Kiểm tra quy tắc Anti-Spam: Mỗi sinh viên chỉ được đánh giá cùng 1 Mentor tối đa 1 lần trong 7 ngày
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        boolean recentlyReviewed = mentorReviewRepository.hasReviewedRecently(student.getId(), mentorProfile.getId(), sevenDaysAgo);
        if (recentlyReviewed) {
            throw new BadRequestException("Bạn chỉ có thể gửi đánh giá cho Mentor này tối đa 1 lần trong vòng 7 ngày.");
        }

        int stars = request.getRating();

        // 3. Tính điểm chất lượng từ đánh giá (S_reviews)
        // 5 sao: +10 | 4 sao: +5 | 3 sao: +0 | 2 sao: -10 | 1 sao: -25
        int pointsFromReview = switch (stars) {
            case 5 -> 10;
            case 4 -> 5;
            case 3 -> 0;
            case 2 -> -10;
            case 1 -> -25;
            default -> throw new BadRequestException("Số sao đánh giá phải từ 1 đến 5.");
        };

        // 4. Kiểm tra Chuỗi đánh giá tích cực (Streak S_bonus): 5 lượt liên tiếp >= 4 sao -> +20 điểm
        int bonusPoints = 0;
        if (stars >= 4) {
            List<MentorReview> recentReviews = mentorReviewRepository.findTop5ByMentorProfileIdOrderByCreatedAtDesc(mentorProfile.getId());
            // Cần 4 đánh giá trước đó đều >= 4 sao để khi cộng đánh giá hiện tại đạt streak 5
            if (recentReviews.size() >= 4) {
                boolean allPositive = recentReviews.subList(0, 4).stream().allMatch(r -> r.getRating() >= 4);
                if (allPositive) {
                    bonusPoints += 20;
                    log.info("Mentor profileId={} đạt Streak 5 đánh giá tích cực! Thưởng +20 điểm uy tín.", mentorProfile.getId());
                }
            }
        }

        int totalAwarded = pointsFromReview + bonusPoints;

        // 5. Cập nhật chỉ số đánh giá trung bình & số lượng
        int currentReviewCount = mentorProfile.getReviewCount() != null ? mentorProfile.getReviewCount() : 0;
        BigDecimal currentRating = mentorProfile.getRating() != null ? mentorProfile.getRating() : BigDecimal.ZERO;

        int newReviewCount = currentReviewCount + 1;
        BigDecimal newRating;
        if (currentReviewCount == 0) {
            newRating = BigDecimal.valueOf(stars).setScale(2, RoundingMode.HALF_UP);
        } else {
            BigDecimal sumRating = currentRating.multiply(BigDecimal.valueOf(currentReviewCount)).add(BigDecimal.valueOf(stars));
            newRating = sumRating.divide(BigDecimal.valueOf(newReviewCount), 2, RoundingMode.HALF_UP);
        }

        // 6. Cập nhật chỉ số Completed Tasks: Ghi nhận theo tổng số lượt tư vấn có đánh giá từ học viên
        int newCompletedTasks = (mentorProfile.getCompletedTasks() != null ? mentorProfile.getCompletedTasks() : 0) + 1;

        // 7. Cập nhật điểm uy tín (reputation_score >= 0)
        int currentReputation = mentorProfile.getReputationScore() != null ? mentorProfile.getReputationScore() : 0;
        int newReputationScore = Math.max(0, currentReputation + totalAwarded);

        mentorProfile.setRating(newRating);
        mentorProfile.setReviewCount(newReviewCount);
        mentorProfile.setCompletedTasks(newCompletedTasks);
        mentorProfile.setReputationScore(newReputationScore);
        mentorProfile.setUpdatedAt(Instant.now());
        mentorProfileRepository.save(mentorProfile);

        // 8. Lưu bản ghi đánh giá vào cơ sở dữ liệu
        MentorReview review = MentorReview.builder()
                .mentorProfile(mentorProfile)
                .student(student)
                .rating(stars)
                .comment(request.getComment())
                .pointsAwarded(totalAwarded)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        MentorReview savedReview = mentorReviewRepository.save(review);

        // Lấy thông tin sinh viên hiển thị
        UserProfile studentProfile = userProfileRepository.findById(student.getId()).orElse(null);
        String studentName = studentProfile != null ? studentProfile.getFullName() : student.getEmail();
        String studentAvatar = studentProfile != null ? studentProfile.getAvatarUrl() : null;

        log.info("Đánh giá Mentor thành công: mentorProfileId={}, studentId={}, stars={}, pointsAwarded={}, newScore={}",
                mentorProfile.getId(), student.getId(), stars, totalAwarded, newReputationScore);

        return MentorReviewResponse.builder()
                .id(savedReview.getId())
                .mentorProfileId(mentorProfile.getId())
                .studentId(student.getId())
                .studentName(studentName)
                .studentAvatar(studentAvatar)
                .rating(stars)
                .comment(request.getComment())
                .pointsAwarded(totalAwarded)
                .newReputationScore(newReputationScore)
                .newMentorRating(newRating)
                .newReviewCount(newReviewCount)
                .newCompletedTasks(newCompletedTasks)
                .createdAt(savedReview.getCreatedAt())
                .build();
    }

    /**
     * Ghi nhận phản hồi nhanh của Mentor trong vòng 24 giờ (+2 điểm thưởng S_bonus).
     */
    @Override
    @Transactional
    public void recordQuickResponse(Long mentorProfileId) {
        MentorProfile profile = mentorProfileRepository.findById(mentorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + mentorProfileId));

        int currentScore = profile.getReputationScore() != null ? profile.getReputationScore() : 0;
        profile.setReputationScore(currentScore + 2);
        profile.setUpdatedAt(Instant.now());
        mentorProfileRepository.save(profile);
        log.info("Cộng +2 điểm phản hồi nhanh trong 24h cho Mentor profileId={}: newScore={}", mentorProfileId, profile.getReputationScore());
    }

    /**
     * Áp dụng điểm phạt khi bị học viên báo cáo vi phạm được Quản trị viên duyệt (-50 điểm S_penalty).
     */
    @Override
    @Transactional
    public void applyPenalty(Long mentorProfileId, String reason) {
        MentorProfile profile = mentorProfileRepository.findById(mentorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + mentorProfileId));

        int currentScore = profile.getReputationScore() != null ? profile.getReputationScore() : 0;
        int newScore = Math.max(0, currentScore - 50);
        profile.setReputationScore(newScore);
        profile.setUpdatedAt(Instant.now());
        mentorProfileRepository.save(profile);
        log.warn("Trừ -50 điểm vi phạm cho Mentor profileId={}, lý do: {}. newScore={}", mentorProfileId, reason, newScore);
    }
}
