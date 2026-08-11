package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDTO {
    private String title;
    private String company;
    private String employmentType;
    private String location;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String applyUrl;
    private String contactEmail;
}
