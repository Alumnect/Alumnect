package com.alumnect.alumnect_backend.dto.response.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO phản hồi số lượng thông báo chưa đọc của người dùng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnreadNotificationCountResponse {

    private long unreadCount;
}
