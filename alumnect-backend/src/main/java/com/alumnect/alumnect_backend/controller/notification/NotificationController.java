package com.alumnect.alumnect_backend.controller.notification;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.notification.NotificationResponse;
import com.alumnect.alumnect_backend.dto.response.notification.UnreadNotificationCountResponse;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý các yêu cầu liên quan đến thông báo người dùng (Notifications).
 * Hỗ trợ lấy danh sách thông báo phân trang, lấy số lượng chưa đọc, và đánh dấu đã đọc.
 */
@Tag(name = "Notification", description = "Các API liên quan đến thông báo người dùng và số lượng chưa đọc")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách thông báo của người dùng đăng nhập hiện tại theo thứ tự thời gian mới nhất (có phân trang).
     *
     * @param authentication Đối tượng chứa thông tin người dùng đăng nhập
     * @param page           Số trang (mặc định 0)
     * @param size           Số phần tử trên mỗi trang (mặc định 20)
     * @return Danh sách thông báo phân trang
     */
    @Operation(summary = "Lấy danh sách thông báo của tôi (phân trang)")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageResponse<NotificationResponse> result = notificationService.getNotifications(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thông báo thành công", result));
    }

    /**
     * Lấy tổng số thông báo chưa đọc của người dùng hiện tại để hiển thị huy hiệu (badge).
     *
     * @param authentication Đối tượng chứa thông tin người dùng đăng nhập
     * @return Số lượng thông báo chưa đọc
     */
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadNotificationCountResponse>> getUnreadCount(
            Authentication authentication
    ) {
        UnreadNotificationCountResponse result = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy số thông báo chưa đọc thành công", result));
    }

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc.
     *
     * @param authentication Đối tượng chứa thông tin người dùng đăng nhập
     * @param id             ID của thông báo
     * @return Kết quả thành công
     */
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        notificationService.markAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc thành công", null));
    }

    /**
     * Đánh dấu toàn bộ thông báo chưa đọc của người dùng là đã đọc.
     *
     * @param authentication Đối tượng chứa thông tin người dùng đăng nhập
     * @return Kết quả thành công
     */
    @Operation(summary = "Đánh dấu toàn bộ thông báo là đã đọc")
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            Authentication authentication
    ) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu tất cả thông báo là đã đọc thành công", null));
    }
}
