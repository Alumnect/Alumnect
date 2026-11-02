package com.alumnect.alumnect_backend.mapper.notification;

import com.alumnect.alumnect_backend.dto.response.notification.SystemNotificationResponse;
import com.alumnect.alumnect_backend.entity.notification.SystemNotification;
import com.alumnect.alumnect_backend.entity.user.User;
import org.springframework.stereotype.Component;

/**
 * Mapper chuyển đổi thực thể SystemNotification sang SystemNotificationResponse.
 */
@Component
public class SystemNotificationMapper {

    public SystemNotificationResponse toDto(SystemNotification entity) {
        if (entity == null) {
            return null;
        }

        SystemNotificationResponse.RecipientUserSummary recipientSummary = null;
        if (entity.getRecipientUser() != null) {
            User u = entity.getRecipientUser();
            String fullName = u.getProfile() != null ? u.getProfile().getFullName() : null;
            String avatarUrl = u.getProfile() != null ? u.getProfile().getAvatarUrl() : null;
            String studentCode = u.getProfile() != null ? u.getProfile().getStudentCode() : null;
            String role = u.getRole() != null ? u.getRole().getName() : null;

            recipientSummary = SystemNotificationResponse.RecipientUserSummary.builder()
                    .id(u.getId())
                    .fullName(fullName)
                    .email(u.getEmail())
                    .studentCode(studentCode)
                    .avatarUrl(avatarUrl)
                    .role(role)
                    .build();
        }

        SystemNotificationResponse.AdminCreatorSummary creatorSummary = null;
        if (entity.getCreatedBy() != null) {
            User admin = entity.getCreatedBy();
            String fullName = admin.getProfile() != null ? admin.getProfile().getFullName() : null;
            String avatarUrl = admin.getProfile() != null ? admin.getProfile().getAvatarUrl() : null;

            creatorSummary = SystemNotificationResponse.AdminCreatorSummary.builder()
                    .id(admin.getId())
                    .fullName(fullName)
                    .email(admin.getEmail())
                    .avatarUrl(avatarUrl)
                    .build();
        }

        return SystemNotificationResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .recipientType(entity.getRecipientType())
                .recipientRole(entity.getRecipientRole())
                .recipientUser(recipientSummary)
                .status(entity.getStatus())
                .durationType(entity.getDurationType())
                .scheduledAt(entity.getScheduledAt())
                .sentAt(entity.getSentAt())
                .expiresAt(entity.getExpiresAt())
                .archivedAt(entity.getArchivedAt())
                .createdBy(creatorSummary)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
