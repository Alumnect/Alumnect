package com.alumnect.alumnect_backend.dto.response.careerpath;

import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerPathDetailResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private List<ExperienceResponse> experiences;
}
