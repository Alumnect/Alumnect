package com.alumnect.alumnect_backend.controller.event;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventAttendeeResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventRegistrationResponse;
import com.alumnect.alumnect_backend.service.event.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các yêu cầu liên quan đến Sự kiện và Đăng ký tham gia (RSVP)
 * (UC25 - Register to attend an event RSVP).
 * Tự động ánh xạ với tiền tố global /api/v1/events.
 */
@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /**
     * API đăng ký tham gia sự kiện (RSVP) (UC25).
     * Yêu cầu JWT; chỉ dành cho Student hoặc Alumni.
     *
     * @param eventId        ID của sự kiện
     * @param authentication Thông tin xác thực người dùng
     * @return Thông tin kết quả đăng ký kèm số lượng người tham gia cập nhật
     */
    @PostMapping("/{eventId}/rsvp")
    public ResponseEntity<ApiResponse<EventRegistrationResponse>> rsvpEvent(
            @PathVariable Long eventId,
            Authentication authentication) {
        EventRegistrationResponse response = eventService.rsvpEvent(eventId, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tham gia sự kiện thành công!", response));
    }

    /**
     * API hủy đăng ký tham gia sự kiện (Cancel RSVP) (UC25).
     * Yêu cầu JWT; chỉ dành cho Student hoặc Alumni đã đăng ký trước đó.
     *
     * @param eventId        ID của sự kiện
     * @param authentication Thông tin xác thực người dùng
     * @return Thông tin kết quả hủy đăng ký kèm số lượng người tham gia cập nhật
     */
    @DeleteMapping("/{eventId}/rsvp")
    public ResponseEntity<ApiResponse<EventRegistrationResponse>> cancelRsvp(
            @PathVariable Long eventId,
            Authentication authentication) {
        EventRegistrationResponse response = eventService.cancelRsvp(eventId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Hủy đăng ký tham gia sự kiện thành công!", response));
    }

    /**
     * API kiểm tra trạng thái RSVP của người dùng đối với sự kiện.
     * Công khai cho Guest (trả về registered: false); nếu có JWT thì kiểm tra theo tài khoản.
     *
     * @param eventId        ID của sự kiện
     * @param authentication Thông tin xác thực người dùng (nếu có)
     * @return Trạng thái đăng ký và số người tham gia hiện tại
     */
    @GetMapping("/{eventId}/rsvp")
    public ResponseEntity<ApiResponse<EventRegistrationResponse>> getRsvpStatus(
            @PathVariable Long eventId,
            Authentication authentication) {
        String email = isAuthenticated(authentication) ? authentication.getName() : null;
        EventRegistrationResponse response = eventService.getRsvpStatus(eventId, email);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái đăng ký thành công", response));
    }

    /**
     * API lấy danh sách người tham gia sự kiện (Attendees) (UC25).
     * Công khai cho mọi đối tượng xem danh sách người tham gia.
     *
     * @param eventId ID của sự kiện
     * @return Danh sách người tham gia sự kiện
     */
    @GetMapping("/{eventId}/attendees")
    public ResponseEntity<ApiResponse<List<EventAttendeeResponse>>> getEventAttendees(
            @PathVariable Long eventId) {
        List<EventAttendeeResponse> attendees = eventService.getEventAttendees(eventId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người tham gia thành công", attendees));
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
