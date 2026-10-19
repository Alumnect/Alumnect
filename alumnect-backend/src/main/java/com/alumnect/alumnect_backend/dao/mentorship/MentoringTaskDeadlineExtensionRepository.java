package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskDeadlineExtension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn các Ticket gia hạn thời hạn Mentoring Task (UC109).
 */
@Repository
public interface MentoringTaskDeadlineExtensionRepository extends JpaRepository<MentoringTaskDeadlineExtension, Long> {

    /** Lấy toàn bộ lịch sử yêu cầu gia hạn theo Task ID theo thứ tự tạo mới nhất */
    List<MentoringTaskDeadlineExtension> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy toàn bộ lịch sử yêu cầu gia hạn theo Conversation ID theo thứ tự tạo mới nhất */
    List<MentoringTaskDeadlineExtension> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /** Tìm Ticket gia hạn đang ở trạng thái PENDING của một Task */
    Optional<MentoringTaskDeadlineExtension> findFirstByTaskIdAndStatusOrderByCreatedAtDesc(Long taskId, MentoringExtensionStatus status);

    /** Lấy danh sách ticket theo trạng thái của Task */
    List<MentoringTaskDeadlineExtension> findByTaskIdAndStatus(Long taskId, MentoringExtensionStatus status);

    /** Kiểm tra xem Task có yêu cầu gia hạn nào đang PENDING hay không */
    boolean existsByTaskIdAndStatus(Long taskId, MentoringExtensionStatus status);

    List<MentoringTaskDeadlineExtension> findByStatusAndCreatedAtBefore(
            MentoringExtensionStatus status, Instant createdAt);
}
