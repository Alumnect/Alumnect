package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO đại diện cho thông tin sự kiện gắn kèm bài viết (UC15, UC16, UC25).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Long id;
    private String title;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private Integer capacity;
    private Integer attendeeCount;
    private Boolean isRegistered;
}
