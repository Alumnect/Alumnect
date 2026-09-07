package com.alumnect.alumnect_backend.dao.notification;

import com.alumnect.alumnect_backend.common.enums.NotificationType;
import com.alumnect.alumnect_backend.entity.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Interface Repository truy xuất và thao tác dữ liệu thông báo người dùng trong cơ sở dữ liệu.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Lấy danh sách thông báo của người nhận theo thứ tự thời gian mới nhất (có phân trang).
     *
     * @param recipientId ID người nhận
     * @param pageable    Thông tin phân trang
     * @return Trang danh sách thông báo
     */
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    /**
     * Đếm số lượng thông báo chưa đọc của người dùng.
     *
     * @param recipientId ID người nhận
     * @return Số lượng thông báo chưa đọc
     */
    long countByRecipientIdAndIsReadFalse(Long recipientId);

    /**
     * Tìm thông báo chưa đọc theo loại, target_type và target_id để gom nhóm (ví dụ: thông báo Like bài viết).
     *
     * @param recipientId ID người nhận
     * @param type        Loại thông báo
     * @param targetType  Loại đối tượng mục tiêu
     * @param targetId    ID đối tượng mục tiêu
     * @return Thông báo chưa đọc nếu có
     */
    Optional<Notification> findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
            Long recipientId,
            NotificationType type,
            String targetType,
            String targetId
    );

    /**
     * Đánh dấu toàn bộ thông báo chưa đọc của người dùng là đã đọc.
     *
     * @param recipientId ID người nhận
     * @return Số lượng bản ghi được cập nhật
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.updatedAt = CURRENT_TIMESTAMP WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllAsReadByRecipientId(@Param("recipientId") Long recipientId);

    /**
     * Đánh dấu một thông báo cụ thể của người dùng là đã đọc.
     *
     * @param id          ID thông báo
     * @param recipientId ID người nhận
     * @return Số lượng bản ghi được cập nhật (1 nếu thành công, 0 nếu không tìm thấy hoặc không thuộc người dùng)
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.updatedAt = CURRENT_TIMESTAMP WHERE n.id = :id AND n.recipient.id = :recipientId")
    int markAsReadByIdAndRecipientId(@Param("id") Long id, @Param("recipientId") Long recipientId);
}
