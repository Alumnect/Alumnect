package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrimaryExperienceResponse {
    private Long id;
    private String title;
    private String company;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
