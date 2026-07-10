package com.alumnect.alumnect_backend.dto.response.careerpath;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerPathSummaryResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private Boolean verifiedStatus;
    private Integer cohort;
    private String major;
    private String currentTitle;
    private String currentCompany;
    private String currentLocation;
    private List<CareerPreviewItem> careerPreview;
    private Integer totalExperiences;
}
