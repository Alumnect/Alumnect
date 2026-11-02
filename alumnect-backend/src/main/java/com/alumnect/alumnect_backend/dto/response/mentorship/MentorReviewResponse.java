package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi kết quả đánh giá Mentor.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorReviewResponse {
    private Long id;
    private Long mentorProfileId;
    private Long studentId;
    private String studentName;
    private String studentAvatar;
    private Integer rating;
    private String comment;
    private Integer pointsAwarded;
    private Integer newReputationScore;
    private BigDecimal newMentorRating;
    private Integer newReviewCount;
    private Integer newCompletedTasks;
    private Instant createdAt;
}
