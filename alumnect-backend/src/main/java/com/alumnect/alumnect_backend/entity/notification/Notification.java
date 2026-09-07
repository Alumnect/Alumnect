package com.alumnect.alumnect_backend.entity.notification;

import com.alumnect.alumnect_backend.common.enums.NotificationType;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Thực thể lưu trữ thông báo người dùng trong hệ thống AlumNect.
 */
@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Người nhận thông báo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /**
     * Người kích hoạt hành động thông báo (null nếu là thông báo hệ thống/tự động).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    /**
     * Phân loại thông báo (POST_LIKE, POST_COMMENT, USER_FOLLOW, FORUM_ANSWER, REPORT_RESOLVED, WELCOME).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    /**
     * Tiêu đề thông báo ngắn gọn.
     */
    @Column(length = 255)
    private String title;

    /**
     * Nội dung thông báo hiển thị cho người dùng.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Loại đối tượng mục tiêu để điều hướng (POST, USER, QUESTION, SYSTEM).
     */
    @Column(name = "target_type", length = 50)
    private String targetType;

    /**
     * Định danh đối tượng mục tiêu (ID bài viết, username/ID người dùng, ID câu hỏi).
     */
    @Column(name = "target_id", length = 100)
    private String targetId;

    /**
     * Số lượng người gửi gom nhóm (ví dụ khi có nhiều lượt thích: Người mới nhất + (senderCount - 1) người khác).
     */
    @Column(name = "sender_count", nullable = false)
    @Builder.Default
    private Integer senderCount = 1;

    /**
     * Trạng thái đã đọc hay chưa.
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * Thời điểm tạo thông báo.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Thời điểm cập nhật thông báo (phục vụ gom nhóm đẩy thông báo lên đầu).
     */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (senderCount == null) {
            senderCount = 1;
        }
        if (isRead == null) {
            isRead = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
