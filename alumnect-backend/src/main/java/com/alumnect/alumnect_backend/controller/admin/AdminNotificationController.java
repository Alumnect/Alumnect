package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
import com.alumnect.alumnect_backend.dto.request.notification.CreateSystemNotificationRequest;
import com.alumnect.alumnect_backend.dto.response.notification.SystemNotificationResponse;
import com.alumnect.alumnect_backend.service.notification.AdminNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý thông báo hệ thống và phát sóng broadcast dành cho Quản trị viên (Admin).
 */
@Tag(name = "Admin Notification", description = "Các API quản lý, hẹn giờ và gửi thông báo hệ thống của Admin")
@RestController
@RequestMapping("/admin/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    /**
     * Lấy danh sách lịch sử thông báo hệ thống của Admin (có phân trang và lọc theo thời gian / trạng thái).
     */
    @Operation(summary = "Lấy lịch sử thông báo hệ thống phân trang")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SystemNotificationResponse>>> getSystemNotifications(
            @RequestParam(defaultValue = "ALL") String timeFilter,
            @RequestParam(required = false) SystemNotificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<SystemNotificationResponse> result = adminNotificationService.getSystemNotifications(timeFilter, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thông báo hệ thống thành công", result));
    }

    /**
     * Tạo và gửi thông báo hệ thống ngay lập tức hoặc hẹn giờ gửi trong tương lai.
     */
    @Operation(summary = "Tạo mới hoặc hẹn giờ gửi thông báo hệ thống")
    @PostMapping
    public ResponseEntity<ApiResponse<SystemNotificationResponse>> createSystemNotification(
            Authentication authentication,
            @Valid @RequestBody CreateSystemNotificationRequest request
    ) {
        SystemNotificationResponse result = adminNotificationService.createSystemNotification(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Tạo thông báo hệ thống thành công", result));
    }

    /**
     * Hủy bỏ một thông báo đã lên lịch hẹn giờ gửi.
     */
    @Operation(summary = "Hủy thông báo đã lên lịch")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelScheduledNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        adminNotificationService.cancelScheduledNotification(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Hủy thông báo hẹn giờ thành công", null));
    }

    /**
     * Lưu trữ một thông báo hệ thống vào kho lưu trữ (Archive).
     */
    @Operation(summary = "Lưu trữ thông báo vào lịch sử lưu trữ (Archive)")
    @PutMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        adminNotificationService.archiveNotification(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Lưu trữ thông báo thành công", null));
    }
}
