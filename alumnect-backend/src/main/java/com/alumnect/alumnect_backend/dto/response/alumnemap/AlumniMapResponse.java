package com.alumnect.alumnect_backend.dto.response.alumnemap;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniMapResponse {

    private Long userId;

    private Long majorId;

    private String fullName;

    private String avatarUrl;

    private Boolean verifiedStatus;

    private String title;

    private String company;

    private String location;

    private String locationCity;

    private String locationCountry;

    private String locationCountryCode;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private LocalDate startDate;

    private String profileIdentifier;

    private Integer cohort;
}
