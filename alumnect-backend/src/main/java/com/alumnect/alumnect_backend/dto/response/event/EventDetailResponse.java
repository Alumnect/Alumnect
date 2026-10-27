package com.alumnect.alumnect_backend.dto.response.event;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class EventDetailResponse {
    private Long eventId;
    private Long postId;
    private String title;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private Integer capacity;
    private int attendeeCount;
    private String status;
    private Long organizerId;
    private String organizerName;
    private boolean registered;
    private boolean started;
    private boolean canRegister;
    private boolean canCancelRegistration;
    private boolean canCancel;
}
