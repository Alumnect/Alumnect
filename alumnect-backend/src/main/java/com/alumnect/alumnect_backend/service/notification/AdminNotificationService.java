package com.alumnect.alumnect_backend.service.notification;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
import com.alumnect.alumnect_backend.dto.request.notification.CreateSystemNotificationRequest;
import com.alumnect.alumnect_backend.dto.response.notification.SystemNotificationResponse;

/**
 * Service quản lý các nghiệp vụ thông báo hệ thống dành cho Quản trị viên (Admin).
 */
public interface AdminNotificationService {

    /**
     * Lấy danh sách lịch sử thông báo hệ thống với bộ lọc thời gian và trạng thái (phân trang).
     *
     * @param timeFilter Bộ lọc thời gian: TODAY, THIS_WEEK, THIS_MONTH, ALL
     * @param status     Bộ lọc trạng thái (tùy chọn)
     * @param page       Số trang
     * @param size       Kích thước trang
     * @return Danh sách phân trang thông báo hệ thống
     */
    PageResponse<SystemNotificationResponse> getSystemNotifications(String timeFilter, SystemNotificationStatus status, int page, int size);

    /**
     * Tạo và xử lý gửi ngay hoặc lên lịch gửi thông báo hệ thống.
     *
     * @param adminEmail Email của Admin thực hiện
     * @param request    Thông tin tạo thông báo
     * @return Thông tin thông báo sau khi tạo/gửi
     */
    SystemNotificationResponse createSystemNotification(String adminEmail, CreateSystemNotificationRequest request);

    /**
     * Hủy bỏ một thông báo đã lên lịch trước đó (chỉ áp dụng khi status = SCHEDULED).
     *
     * @param adminEmail     Email của Admin thực hiện
     * @param notificationId ID thông báo cần hủy
     */
    void cancelScheduledNotification(String adminEmail, Long notificationId);

    /**
     * Lưu trữ một thông báo hệ thống vào kho lưu trữ (Archive).
     * Áp dụng khi thông báo ở trạng thái ACTIVE, SENT, hoặc EXPIRED.
     *
     * @param adminEmail     Email của Admin thực hiện
     * @param notificationId ID thông báo cần lưu trữ
     */
    void archiveNotification(String adminEmail, Long notificationId);

    /**
     * Tự động quét và phát hành các thông báo đã đến giờ hẹn (dùng cho Cron Job).
     */
    void executeScheduledNotifications();

    /**
     * Tự động quét và chuyển trạng thái EXPIRED cho các thông báo đã hết hạn hiệu lực (dùng cho Cron Job).
     */
    void expireOverdueNotifications();
}
