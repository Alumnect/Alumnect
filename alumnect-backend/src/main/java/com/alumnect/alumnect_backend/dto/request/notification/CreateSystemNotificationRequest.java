package com.alumnect.alumnect_backend.dto.request.notification;

import com.alumnect.alumnect_backend.common.enums.NotificationDuration;
import com.alumnect.alumnect_backend.common.enums.RecipientType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Yêu cầu tạo mới thông báo hệ thống từ Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSystemNotificationRequest {

    /**
     * Tiêu đề thông báo.
     */
    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    /**
     * Nội dung thông báo.
     */
    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String content;

    /**
     * Loại đối tượng nhận (SPECIFIC_USER, USER_ROLE, ALL_USERS).
     */
    @NotNull(message = "Vui lòng chọn loại đối tượng nhận")
    private RecipientType recipientType;

    /**
     * Tên vai trò (STUDENT, ALUMNI, ADMIN) nếu recipientType là USER_ROLE.
     */
    private String recipientRole;

    /**
     * ID của người dùng nếu recipientType là SPECIFIC_USER.
     */
    private Long recipientUserId;

    /**
     * Thời hạn hiệu lực của thông báo (ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR, FOREVER).
     */
    @NotNull(message = "Vui lòng chọn thời hạn hiệu lực của thông báo")
    private NotificationDuration durationType;

    /**
     * Đánh dấu có hẹn giờ gửi hay gửi ngay (true: Hẹn giờ, false: Gửi ngay).
     */
    @Builder.Default
    private Boolean isScheduled = false;

    /**
     * Thời điểm hẹn giờ gửi (bắt buộc nếu isScheduled = true).
     */
    private Instant scheduledAt;

    /**
     * Thời điểm cụ thể thông báo hết hiệu lực (sử dụng khi durationType là CUSTOM hoặc chỉ định mốc thời gian cụ thể).
     */
    private Instant expiresAt;
}
