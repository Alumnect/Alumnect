package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private String title;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private Integer capacity;
}
