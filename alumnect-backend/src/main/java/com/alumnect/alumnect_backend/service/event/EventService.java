package com.alumnect.alumnect_backend.service.event;

import com.alumnect.alumnect_backend.dto.response.event.EventAttendeeResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventRegistrationResponse;

import java.util.List;

/**
 * Service định nghĩa các thao tác nghiệp vụ cho Sự kiện & RSVP (UC25).
 */
public interface EventService {

    /**
     * Đăng ký tham gia sự kiện (RSVP) (UC25).
     * Chỉ dành cho STUDENT và ALUMNI.
     */
    EventRegistrationResponse rsvpEvent(Long eventId, String email);

    /**
     * Hủy đăng ký tham gia sự kiện (Cancel RSVP) (UC25).
     * Chỉ dành cho STUDENT và ALUMNI.
     */
    EventRegistrationResponse cancelRsvp(Long eventId, String email);

    /**
     * Kiểm tra trạng thái RSVP của người dùng hiện tại đối với sự kiện.
     */
    EventRegistrationResponse getRsvpStatus(Long eventId, String email);

    /**
     * Lấy danh sách những người đã đăng ký tham gia sự kiện (UC25).
     */
    List<EventAttendeeResponse> getEventAttendees(Long eventId);
}
