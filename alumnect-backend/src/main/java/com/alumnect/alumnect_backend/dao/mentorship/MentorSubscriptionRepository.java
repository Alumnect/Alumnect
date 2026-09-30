package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Interface DAO truy xuất dữ liệu đăng ký gói Mentor (mentor_subscriptions).
 */
@Repository
public interface MentorSubscriptionRepository extends JpaRepository<MentorSubscription, Long> {

    /**
     * Tìm đăng ký gói mới nhất theo ID hồ sơ Mentor và trạng thái cụ thể.
     *
     * @param mentorProfileId ID của hồ sơ Mentor
     * @param status Trạng thái đăng ký (ví dụ: PENDING_PAYMENT, PAID)
     * @return Optional chứa đăng ký mới nhất nếu có
     */
    Optional<MentorSubscription> findFirstByMentorProfileIdAndStatusOrderByCreatedAtDesc(Long mentorProfileId, MentorSubscriptionStatus status);

    /**
     * Tìm đăng ký gói mới nhất của hồ sơ Mentor.
     *
     * @param mentorProfileId ID của hồ sơ Mentor
     * @return Optional chứa đăng ký mới nhất
     */
    Optional<MentorSubscription> findFirstByMentorProfileIdOrderByCreatedAtDesc(Long mentorProfileId);

    /**
     * Tìm tất cả đăng ký gói của hồ sơ Mentor.
     *
     * @param mentorProfileId ID của hồ sơ Mentor
     * @return Danh sách các bản ghi đăng ký gói
     */
    List<MentorSubscription> findByMentorProfileIdOrderByCreatedAtDesc(Long mentorProfileId);
}
