package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn dữ liệu nhật ký công việc Mentoring Work Log (UC107).
 */
@Repository
public interface MentoringWorkLogRepository extends JpaRepository<MentoringWorkLog, Long> {

    /**
     * Lấy danh sách tất cả Work Logs của một Task theo thứ tự ngày làm việc mới nhất.
     *
     * @param taskId ID nhiệm vụ Mentoring
     * @return Danh sách các bản ghi Work Log kèm attachments
     */
    @Query("SELECT DISTINCT w FROM MentoringWorkLog w LEFT JOIN FETCH w.attachments WHERE w.task.id = :taskId ORDER BY w.logDate DESC, w.createdAt DESC")
    List<MentoringWorkLog> findByTaskIdOrderByLogDateDesc(@Param("taskId") Long taskId);

    /**
     * Tra cứu một bản ghi Work Log theo ID và Task ID để chống lỗi IDOR / sai Task.
     *
     * @param id ID của Work Log
     * @param taskId ID của Task chứa Work Log
     * @return Optional chứa bản ghi nếu khớp
     */
    Optional<MentoringWorkLog> findByIdAndTaskId(Long id, Long taskId);

    /**
     * Đếm tổng số Work Log trong một Task.
     *
     * @param taskId ID nhiệm vụ Mentoring
     * @return Tổng số lượng nhật ký
     */
    long countByTaskId(Long taskId);

    /**
     * Đếm số lượng Work Log theo trạng thái (chờ duyệt, đã duyệt, từ chối).
     *
     * @param taskId ID nhiệm vụ Mentoring
     * @param status Trạng thái cần đếm
     * @return Số lượng nhật ký khớp trạng thái
     */
    long countByTaskIdAndStatus(Long taskId, WorkLogStatus status);

    List<MentoringWorkLog> findByStatusAndCreatedAtBefore(
            WorkLogStatus status, Instant createdAt);
}
