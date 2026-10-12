package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentorReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy xuất dữ liệu đánh giá Mentor (mentor_reviews).
 */
@Repository
public interface MentorReviewRepository extends JpaRepository<MentorReview, Long> {

    /**
     * Tìm đánh giá mới nhất của một sinh viên cho một Mentor cụ thể (phục vụ kiểm tra Anti-Spam 7 ngày).
     */
    Optional<MentorReview> findTopByStudentIdAndMentorProfileIdOrderByCreatedAtDesc(Long studentId, Long mentorProfileId);

    /**
     * Lấy 5 đánh giá mới nhất của Mentor (phục vụ kiểm tra chuỗi đánh giá tích cực Streak).
     */
    List<MentorReview> findTop5ByMentorProfileIdOrderByCreatedAtDesc(Long mentorProfileId);

    /**
     * Phân trang danh sách đánh giá của Mentor.
     */
    Page<MentorReview> findByMentorProfileIdOrderByCreatedAtDesc(Long mentorProfileId, Pageable pageable);

    /**
     * Đếm số lượt đánh giá của Mentor.
     */
    long countByMentorProfileId(Long mentorProfileId);

    /**
     * Kiểm tra sinh viên đã đánh giá Mentor trong khoảng thời gian nhất định chưa.
     */
    @Query("SELECT COUNT(mr) > 0 FROM MentorReview mr WHERE mr.student.id = :studentId AND mr.mentorProfile.id = :mentorProfileId AND mr.createdAt >= :afterTime")
    boolean hasReviewedRecently(@Param("studentId") Long studentId, @Param("mentorProfileId") Long mentorProfileId, @Param("afterTime") Instant afterTime);
}
