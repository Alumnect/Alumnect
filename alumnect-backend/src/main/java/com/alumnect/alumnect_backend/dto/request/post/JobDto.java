package com.alumnect.alumnect_backend.dto.request.post;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class JobDto {
    private String title;
    private String company;
    private String location;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String applyUrl;
    private String contactEmail;
}
