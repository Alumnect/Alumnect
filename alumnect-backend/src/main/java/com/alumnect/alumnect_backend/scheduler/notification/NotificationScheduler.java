package com.alumnect.alumnect_backend.scheduler.notification;

import com.alumnect.alumnect_backend.service.notification.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tác vụ nền định kỳ (Cron Job) phục vụ:
 * 1. Tự động quét và phát hành các thông báo hệ thống đã đến lịch hẹn (SCHEDULED -> SENT).
 * 2. Tự động quét và chuyển trạng thái các thông báo hệ thống đã hết hạn (SENT -> EXPIRED).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final AdminNotificationService adminNotificationService;

    /**
     * Chạy định kỳ mỗi 1 phút để xử lý phát thông báo hẹn giờ và hết hạn thông báo.
     */
    @Scheduled(cron = "0 * * * * *")
    public void processScheduledAndExpiredNotifications() {
        try {
            adminNotificationService.executeScheduledNotifications();
        } catch (Exception e) {
            log.error("Lỗi khi chạy cron job phát thông báo hẹn giờ: {}", e.getMessage(), e);
        }

        try {
            adminNotificationService.expireOverdueNotifications();
        } catch (Exception e) {
            log.error("Lỗi khi chạy cron job cập nhật thông báo hết hạn: {}", e.getMessage(), e);
        }
    }
}
