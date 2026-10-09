package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
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
 * Repository truy vấn và thao tác dữ liệu bảng mentor_profiles.
 */
@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long> {

    /**
     * Tìm hồ sơ Mentor theo userId của cựu sinh viên.
     */
    Optional<MentorProfile> findByUserId(Long userId);

    /**
     * Lấy danh sách hồ sơ Mentor theo danh sách userId.
     */
    List<MentorProfile> findByUserIdIn(List<Long> userIds);

    /**
     * Truy vấn danh sách Mentor đủ điều kiện xếp hạng theo lĩnh vực chuyên môn (UC97).
     * Điều kiện lọc nghiêm ngặt (BR-02 & BR-06):
     * 1. Trạng thái Mentor hồ sơ là ACTIVE.
     * 2. Trạng thái tài khoản người dùng là ACTIVE.
     * 3. Mentor hỗ trợ lĩnh vực chuyên môn (industry) được chọn.
     * 4. Gói đăng ký Mentor (subscription) đang còn hiệu lực (ACTIVE hoặc PAID) và chưa hết hạn (endDate > now).
     *
     * Thuật toán sắp xếp thứ hạng deterministic (BR-04):
     * - Điểm uy tín reputationScore DESC
     * - Số tác vụ hoàn thành completedTasks DESC
     * - Đánh giá rating DESC
     * - Khóa chính id ASC (tie-breaker)
     *
     * @param fieldId ID của lĩnh vực chuyên môn (ngành nghề)
     * @param now Thời điểm hiện tại kiểm tra hiệu lực gói
     * @param pageable Đối tượng phân trang
     * @return Trang chứa các hồ sơ Mentor đã được xếp hạng
     */
    @Query("""
        SELECT mp FROM MentorProfile mp
        JOIN mp.user u
        WHERE mp.mentorStatus = com.alumnect.alumnect_backend.common.enums.MentorStatus.ACTIVE
          AND u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE
          AND EXISTS (
              SELECT 1 FROM MentorSupportedField msf
              WHERE msf.mentorProfile.id = mp.id AND msf.industry.id = :fieldId
          )
          AND EXISTS (
              SELECT 1 FROM MentorSubscription sub
              WHERE sub.mentorProfile.id = mp.id
                AND (sub.status = com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus.ACTIVE
                     OR sub.status = com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus.PAID)
                AND sub.endDate > :now
          )
        ORDER BY mp.reputationScore DESC, mp.completedTasks DESC, mp.rating DESC, mp.id ASC
    """)
    Page<MentorProfile> findRankedMentorsByField(
            @Param("fieldId") Long fieldId,
            @Param("now") Instant now,
            Pageable pageable
    );
}
