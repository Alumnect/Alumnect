package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.MentorReviewRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorReviewResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;

/**
 * Service quản lý và tính toán điểm uy tín (reputation_score) cho Mentor.
 * Tuân thủ quy chế tính điểm:
 * Reputation Score = (Base + S_reviews + S_bonus) - S_penalty
 */
public interface MentorReputationService {

    /**
     * Tính toán điểm nền tảng hồ sơ ban đầu (Base Score: +50 xác thực Alumni, +10 đầy đủ hồ sơ năng lực).
     */
    int calculateBaseScore(Long mentorProfileId);

    /**
     * Khởi tạo điểm nền tảng khi Mentor được kích hoạt ACTIVE.
     */
    void initializeBaseScore(MentorProfile profile);

    /**
     * Học viên gửi đánh giá cho Mentor (1 - 5 sao).
     * Kiểm tra quy tắc Anti-Spam (1 lần / 7 ngày).
     * Tính điểm chất lượng S_reviews (+10, +5, 0, -10, -25).
     * Cập nhật chỉ số rating trung bình, review_count, completed_tasks.
     * Kiểm tra chuỗi đánh giá tích cực (Streak 5 liên tiếp >= 4 sao: +20 điểm S_bonus).
     * Đảm bảo reputation_score >= 0.
     */
    MentorReviewResponse submitMentorReview(String studentEmail, MentorReviewRequest request);

    /**
     * Ghi nhận phản hồi nhanh của Mentor trong vòng 24 giờ (+2 điểm thưởng S_bonus).
     */
    void recordQuickResponse(Long mentorProfileId);

    /**
     * Áp dụng điểm phạt khi bị học viên báo cáo vi phạm được Quản trị viên duyệt (-50 điểm S_penalty).
     */
    void applyPenalty(Long mentorProfileId, String reason);
}
