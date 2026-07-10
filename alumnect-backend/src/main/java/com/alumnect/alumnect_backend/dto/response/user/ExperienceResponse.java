package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceResponse {
    private Long id;
    private String title;
    private String company;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isCurrent;
    private boolean isPrimary;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String placeId;
    private String locationCity;
    private String locationCountry;
    private String locationCountryCode;
    private String geocodingProvider;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
