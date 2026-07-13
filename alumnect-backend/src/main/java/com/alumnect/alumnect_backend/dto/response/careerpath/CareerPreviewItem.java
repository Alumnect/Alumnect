package com.alumnect.alumnect_backend.dto.response.careerpath;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerPreviewItem {
    private Long experienceId;
    private String title;
    private String company;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isCurrent;
}
