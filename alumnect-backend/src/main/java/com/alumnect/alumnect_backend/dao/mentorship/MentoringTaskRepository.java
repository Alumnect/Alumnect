package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository truy vấn dữ liệu Mentoring Task (UC105).
 */
@Repository
public interface MentoringTaskRepository extends JpaRepository<MentoringTask, Long> {

    /** Tìm Task theo dealId */
    Optional<MentoringTask> findByDealId(Long dealId);

    /** Kiểm tra xem Deal đã được tạo Task hay chưa */
    boolean existsByDealId(Long dealId);

    /** Lấy danh sách Task của người dùng (Student hoặc Mentor) */
    @Query("SELECT t FROM MentoringTask t WHERE t.student.id = :userId OR t.mentor.id = :userId ORDER BY t.createdAt DESC")
    Page<MentoringTask> findByParticipant(@Param("userId") Long userId, Pageable pageable);

    /** Lấy danh sách Task của người dùng theo trạng thái */
    @Query("SELECT t FROM MentoringTask t WHERE (t.student.id = :userId OR t.mentor.id = :userId) AND t.status = :status ORDER BY t.createdAt DESC")
    Page<MentoringTask> findByParticipantAndStatus(@Param("userId") Long userId, @Param("status") MentoringTaskStatus status, Pageable pageable);

    /** Lấy danh sách Task của người dùng theo danh sách trạng thái (hỗ trợ lọc theo UI Stage) */
    @Query("SELECT t FROM MentoringTask t WHERE (t.student.id = :userId OR t.mentor.id = :userId) AND t.status IN :statuses ORDER BY t.createdAt DESC")
    Page<MentoringTask> findByParticipantAndStatusIn(@Param("userId") Long userId, @Param("statuses") java.util.Collection<MentoringTaskStatus> statuses, Pageable pageable);
}
