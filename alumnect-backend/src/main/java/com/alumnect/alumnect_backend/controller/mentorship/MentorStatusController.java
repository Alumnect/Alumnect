package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorStatusResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý các yêu cầu liên quan đến Xem trạng thái Mentor & Subscription (UC94).
 * Cung cấp API đọc trạng thái hồ sơ Mentor, tiến trình duyệt/hoàn tất và thông tin gói dịch vụ.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/status")
@RequiredArgsConstructor
@Tag(name = "Mentor Status", description = "Các API phục vụ Xem trạng thái Mentor & Subscription (UC94)")
public class MentorStatusController {

    private final MentorStatusService mentorStatusService;

    /**
     * API Lấy toàn bộ trạng thái hồ sơ Mentor và gói Subscription của Alumni đang đăng nhập.
     * Xác thực thông qua Bearer JWT Token trong Security Context.
     * Hỗ trợ cả 2 endpoint: GET /api/v1/mentoring/status và GET /api/v1/mentoring/status/my-status.
     *
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentorStatusResponse
     */
    @GetMapping({"", "/my-status"})
    @Operation(
            summary = "Xem trạng thái Mentor & Subscription",
            description = "Tổng hợp toàn bộ trạng thái hồ sơ, CV, thông tin ngân hàng, điều khoản, gói subscription và trạng thái hoạt động Mentor của người dùng"
    )
    public ResponseEntity<ApiResponse<MentorStatusResponse>> getMentorStatus() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Client yêu cầu truy vấn trạng thái Mentor cho email: {}", email);
        MentorStatusResponse response = mentorStatusService.getMentorStatus(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái Mentor & Subscription thành công", response));
    }
}
