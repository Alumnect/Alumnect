package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskAmendment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn các Ticket điều chỉnh phạm vi/kết quả/tiền bổ sung Mentoring Task (UC109).
 */
@Repository
public interface MentoringTaskAmendmentRepository extends JpaRepository<MentoringTaskAmendment, Long> {

    /** Lấy toàn bộ lịch sử điều chỉnh Task theo Task ID theo thứ tự mới nhất */
    List<MentoringTaskAmendment> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy toàn bộ lịch sử điều chỉnh theo Conversation ID */
    List<MentoringTaskAmendment> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /** Tìm Ticket điều chỉnh đang PENDING hoặc AWAITING_TOPUP của một Task */
    Optional<MentoringTaskAmendment> findFirstByTaskIdAndStatusOrderByCreatedAtDesc(Long taskId, MentoringAmendmentStatus status);

    /** Lấy danh sách ticket theo trạng thái của Task */
    List<MentoringTaskAmendment> findByTaskIdAndStatus(Long taskId, MentoringAmendmentStatus status);

    /** Đếm số phiên bản đã tạo của Task */
    long countByTaskId(Long taskId);

    List<MentoringTaskAmendment> findByStatusAndCreatedAtBefore(
            MentoringAmendmentStatus status, Instant createdAt);

    /** Khóa bản ghi để tuần tự hóa tạo checkout và áp dụng top-up cho cùng một Ticket */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT a FROM MentoringTaskAmendment a WHERE a.id = :id")
    Optional<MentoringTaskAmendment> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
}
