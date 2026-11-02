package com.alumnect.alumnect_backend.entity.notification;

import com.alumnect.alumnect_backend.common.enums.NotificationDuration;
import com.alumnect.alumnect_backend.common.enums.RecipientType;
import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
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
 * Thực thể lưu trữ các thông báo hệ thống do Admin tạo ra (Broadcast, Scheduled, Direct alert).
 */
@Entity
@Table(name = "system_notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tiêu đề thông báo.
     */
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Nội dung chi tiết của thông báo.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Loại đối tượng nhận (SPECIFIC_USER, USER_ROLE, ALL_USERS).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false, length = 50)
    private RecipientType recipientType;

    /**
     * Tên vai trò người nhận nếu gửi theo USER_ROLE (STUDENT, ALUMNI, ADMIN).
     */
    @Column(name = "recipient_role", length = 50)
    private String recipientRole;

    /**
     * Người dùng cụ thể nếu gửi theo SPECIFIC_USER.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id")
    private User recipientUser;

    /**
     * Trạng thái của thông báo hệ thống (DRAFT, SCHEDULED, SENT, ACTIVE, EXPIRED, CANCELLED).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private SystemNotificationStatus status = SystemNotificationStatus.DRAFT;

    /**
     * Thời lượng hiệu lực của thông báo (ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR, FOREVER).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "duration_type", nullable = false, length = 50)
    private NotificationDuration durationType;

    /**
     * Thời điểm dự kiến gửi (nếu có đặt lịch).
     */
    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    /**
     * Thời điểm thực tế thông báo được gửi đi.
     */
    @Column(name = "sent_at")
    private Instant sentAt;

    /**
     * Thời điểm thông báo hết hạn hiệu lực (sentAt + durationType, null nếu FOREVER).
     */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /**
     * Thời điểm Admin lưu trữ thông báo vào kho lưu trữ (Archive). Null nếu chưa lưu trữ.
     */
    @Column(name = "archived_at")
    private Instant archivedAt;

    /**
     * Admin tạo thông báo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /**
     * Thời điểm tạo bản ghi.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Thời điểm cập nhật bản ghi gần nhất.
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
        if (status == null) {
            status = SystemNotificationStatus.DRAFT;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
