package com.alumnect.alumnect_backend.dto.response.notification;

import com.alumnect.alumnect_backend.common.enums.NotificationDuration;
import com.alumnect.alumnect_backend.common.enums.RecipientType;
import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Phản hồi chi tiết thông báo hệ thống dành cho Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemNotificationResponse {

    private Long id;
    private String title;
    private String content;
    private RecipientType recipientType;
    private String recipientRole;

    /** Thông tin người nhận nếu gửi cho một người cụ thể */
    private RecipientUserSummary recipientUser;

    private SystemNotificationStatus status;
    private NotificationDuration durationType;
    private Instant scheduledAt;
    private Instant sentAt;
    private Instant expiresAt;
    private Instant archivedAt;

    /** Admin tạo thông báo */
    private AdminCreatorSummary createdBy;

    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecipientUserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String studentCode;
        private String avatarUrl;
        private String role;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminCreatorSummary {
        private Long id;
        private String fullName;
        private String email;
        private String avatarUrl;
    }
}
