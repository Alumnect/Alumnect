package com.alumnect.alumnect_backend.mapper.notification;

import com.alumnect.alumnect_backend.dto.response.notification.NotificationResponse;
import com.alumnect.alumnect_backend.entity.notification.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi đối tượng thực thể {@link Notification} sang DTO phản hồi {@link NotificationResponse}.
 */
@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(target = "id", source = "notification.id")
    @Mapping(target = "type", source = "notification.type")
    @Mapping(target = "title", source = "notification.title")
    @Mapping(target = "content", source = "notification.content")
    @Mapping(target = "targetType", source = "notification.targetType")
    @Mapping(target = "targetId", source = "notification.targetId")
    @Mapping(target = "senderCount", source = "notification.senderCount")
    @Mapping(target = "isRead", source = "notification.isRead")
    @Mapping(target = "createdAt", source = "notification.createdAt")
    @Mapping(target = "senderId", source = "notification.sender.id")
    @Mapping(
            target = "senderName",
            expression = "java(notification.getSender() != null && notification.getSender().getProfile() != null ? notification.getSender().getProfile().getFullName() : null)"
    )
    @Mapping(
            target = "senderAvatarUrl",
            expression = "java(notification.getSender() != null && notification.getSender().getProfile() != null ? notification.getSender().getProfile().getAvatarUrl() : null)"
    )
    NotificationResponse toDto(Notification notification);
}
