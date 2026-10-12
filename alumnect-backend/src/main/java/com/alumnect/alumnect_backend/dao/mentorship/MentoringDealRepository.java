package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy xuất dữ liệu thỏa thuận Mentoring Deal (UC104).
 */
@Repository
public interface MentoringDealRepository extends JpaRepository<MentoringDeal, Long>, JpaSpecificationExecutor<MentoringDeal> {

    /**
     * Tìm kiếm thỏa thuận theo ID kèm thông tin liên quan giữa hai bên.
     *
     * @param id ID của thỏa thuận Deal
     * @return Thỏa thuận MentoringDeal nếu tồn tại
     */
    @Query("SELECT d FROM MentoringDeal d " +
           "LEFT JOIN FETCH d.student s " +
           "LEFT JOIN FETCH d.mentor m " +
           "LEFT JOIN FETCH d.conversation c " +
           "WHERE d.id = :id")
    Optional<MentoringDeal> findDetailById(@Param("id") Long id);

    /**
     * Lấy thỏa thuận mới nhất liên kết với một cuộc hội thoại Direct Messaging.
     *
     * @param conversationId ID cuộc hội thoại
     * @return Thỏa thuận mới nhất nếu có
     */
    Optional<MentoringDeal> findFirstByConversationIdOrderByUpdatedAtDesc(Long conversationId);

    /**
     * Phân trang danh sách thỏa thuận mà người dùng tham gia với tư cách Học viên (Student) hoặc Cố vấn (Mentor).
     *
     * @param userId ID người dùng
     * @param pageable Cấu hình phân trang
     * @return Trang danh sách thỏa thuận MentoringDeal
     */
    @Query("SELECT d FROM MentoringDeal d " +
           "WHERE (d.student.id = :userId OR d.mentor.id = :userId) " +
           "AND (:status IS NULL OR d.status = :status)")
    Page<MentoringDeal> findByParticipantAndStatus(
            @Param("userId") Long userId,
            @Param("status") MentoringDealStatus status,
            Pageable pageable
    );

    /**
     * Kiểm tra xem giữa Student và Mentor đã có thỏa thuận nào đang ở trạng thái đàm phán hoặc đã chốt chưa.
     *
     * @param studentId ID học viên
     * @param mentorId ID cố vấn
     * @param activeStatuses Danh sách các trạng thái đang hoạt động
     * @return Danh sách thỏa thuận thỏa mãn
     */
    @Query("SELECT d FROM MentoringDeal d " +
           "WHERE d.student.id = :studentId " +
           "AND d.mentor.id = :mentorId " +
           "AND d.status IN :activeStatuses")
    List<MentoringDeal> findActiveDealsBetweenUsers(
            @Param("studentId") Long studentId,
            @Param("mentorId") Long mentorId,
            @Param("activeStatuses") List<MentoringDealStatus> activeStatuses
    );

    /**
     * Tìm tất cả thỏa thuận Deal theo mã Request.
     *
     * @param requestId ID của Mentoring Request
     * @return Danh sách các Deal liên kết với Request
     */
    List<MentoringDeal> findByRequestId(Long requestId);

    /**
     * Tìm các thỏa thuận Deal khác cùng mã Request ngoại trừ Deal hiện tại.
     *
     * @param requestId ID của Mentoring Request
     * @param id ID của Deal hiện tại cần loại trừ
     * @return Danh sách các Deal khác cùng Request
     */
    List<MentoringDeal> findByRequestIdAndIdNot(Long requestId, Long id);
}
