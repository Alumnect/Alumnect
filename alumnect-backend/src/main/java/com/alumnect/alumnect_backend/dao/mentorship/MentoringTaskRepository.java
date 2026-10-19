package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;

/**
 * Repository truy vấn dữ liệu Mentoring Task (UC105).
 */
@Repository
public interface MentoringTaskRepository extends JpaRepository<MentoringTask, Long>, JpaSpecificationExecutor<MentoringTask> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM MentoringTask t WHERE t.id = :id")
    Optional<MentoringTask> findByIdForPayout(@Param("id") Long id);

    /** Tìm Task theo dealId */
    Optional<MentoringTask> findByDealId(Long dealId);

    /** Kiểm tra xem Deal đã được tạo Task hay chưa */
    boolean existsByDealId(Long dealId);

    /** Đếm Task của Mentor theo trạng thái (giới hạn năng lực nhận việc) */
    /** Task theo trạng thái có deadline trước một thời điểm (nhắc hạn / quá hạn) */
    java.util.List<MentoringTask> findByStatusInAndDeadlineBefore(
            java.util.Collection<com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus> statuses, java.time.Instant before);

    long countByMentorIdAndStatusIn(Long mentorId, java.util.Collection<com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus> statuses);

    /** Tìm Task theo requestId */
    Optional<MentoringTask> findByRequestId(Long requestId);

    /** Kiểm tra xem Request đã được kích hoạt Task hay chưa */
    boolean existsByRequestId(Long requestId);

    /** Lấy danh sách Task của người dùng (Student hoặc Mentor) */
    @Query("SELECT DISTINCT t FROM MentoringTask t LEFT JOIN t.request.group g LEFT JOIN g.members gm LEFT JOIN t.request.participatingMembers rm " +
           "WHERE t.student.id = :userId OR t.mentor.id = :userId " +
           "OR rm.user.id = :userId " +
           "OR (gm.user.id = :userId AND (gm.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.JOINED OR gm.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.ACTIVE)) " +
           "ORDER BY t.createdAt DESC")
    Page<MentoringTask> findByParticipant(@Param("userId") Long userId, Pageable pageable);

    /** Lấy danh sách Task của người dùng theo trạng thái */
    @Query("SELECT DISTINCT t FROM MentoringTask t LEFT JOIN t.request.group g LEFT JOIN g.members gm LEFT JOIN t.request.participatingMembers rm " +
           "WHERE (t.student.id = :userId OR t.mentor.id = :userId OR rm.user.id = :userId OR " +
           "(gm.user.id = :userId AND (gm.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.JOINED OR gm.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.ACTIVE))) " +
           "AND t.status = :status ORDER BY t.createdAt DESC")
    Page<MentoringTask> findByParticipantAndStatus(@Param("userId") Long userId, @Param("status") MentoringTaskStatus status, Pageable pageable);

    /** Lấy danh sách Task của người dùng theo danh sách trạng thái (hỗ trợ lọc theo UI Stage) */
    @Query("SELECT DISTINCT t FROM MentoringTask t LEFT JOIN t.request.group g LEFT JOIN g.members gm LEFT JOIN t.request.participatingMembers rm " +
           "WHERE (t.student.id = :userId OR t.mentor.id = :userId OR rm.user.id = :userId OR " +
           "(gm.user.id = :userId AND (gm.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.JOINED OR gm.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.ACTIVE))) " +
           "AND t.status IN :statuses ORDER BY t.createdAt DESC")
    Page<MentoringTask> findByParticipantAndStatusIn(@Param("userId") Long userId, @Param("statuses") java.util.Collection<MentoringTaskStatus> statuses, Pageable pageable);
}
