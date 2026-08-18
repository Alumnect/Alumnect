package com.alumnect.alumnect_backend.dto.request.post;

import lombok.Data;
import java.time.Instant;

@Data
public class EventDto {
    private String title;
    private Instant startTime;
    private Instant endTime;
    private String location;
    private Integer capacity;
}
