package com.alumnect.alumnect_backend.dto.response.notification;

import com.alumnect.alumnect_backend.common.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO phản hồi dữ liệu chi tiết của một thông báo gửi về Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;

    private NotificationType type;

    private String title;

    private String content;

    private String targetType;

    private String targetId;

    private Integer senderCount;

    private Boolean isRead;

    private Instant createdAt;

    /**
     * ID của người kích hoạt thông báo (null nếu là hệ thống).
     */
    private Long senderId;

    /**
     * Tên hiển thị của người kích hoạt (null nếu là hệ thống).
     */
    private String senderName;

    /**
     * Ảnh đại diện của người kích hoạt.
     */
    private String senderAvatarUrl;
}
