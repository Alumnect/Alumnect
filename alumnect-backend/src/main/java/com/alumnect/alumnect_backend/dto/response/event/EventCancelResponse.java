package com.alumnect.alumnect_backend.dto.response.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về kết quả thao tác hủy sự kiện (UC27 - Cancel an event).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventCancelResponse {

    /** ID sự kiện vừa hủy */
    private Long eventId;

    /** Trạng thái mới của sự kiện (CANCELLED) */
    private String status;

    /** Thông báo kết quả */
    private String message;
}
