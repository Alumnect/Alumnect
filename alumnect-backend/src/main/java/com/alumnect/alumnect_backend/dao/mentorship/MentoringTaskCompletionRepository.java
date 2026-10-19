package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringCompletionStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy xuất dữ liệu biên bản nghiệm thu hoàn thành Task (UC110).
 */
@Repository
public interface MentoringTaskCompletionRepository extends JpaRepository<MentoringTaskCompletion, Long> {

    /** Lấy danh sách tất cả các lần nộp nghiệm thu của một Task theo thứ tự mới nhất trước */
    List<MentoringTaskCompletion> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy lần nộp nghiệm thu mới nhất của Task */
    Optional<MentoringTaskCompletion> findFirstByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy lần nộp nghiệm thu đang ở trạng thái chỉ định (thường là PENDING) */
    Optional<MentoringTaskCompletion> findFirstByTaskIdAndStatusOrderByCreatedAtDesc(
            Long taskId, MentoringCompletionStatus status);

    List<MentoringTaskCompletion> findByStatusAndCreatedAtBefore(
            MentoringCompletionStatus status, Instant createdAt);
}
