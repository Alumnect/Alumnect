package com.alumnect.alumnect_backend.dto.response.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về kết quả thao tác đăng ký / hủy đăng ký / kiểm tra RSVP của sự kiện (UC25).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistrationResponse {

    /** ID sự kiện */
    private Long eventId;

    /** Trạng thái người xem hiện tại đã đăng ký tham gia hay chưa */
    private boolean registered;

    /** Số lượng người hiện tại đã đăng ký */
    private int attendeeCount;

    /** Sức chứa tối đa của sự kiện (null nếu không giới hạn) */
    private Integer capacity;

    /** Thông báo kết quả */
    private String message;
}
