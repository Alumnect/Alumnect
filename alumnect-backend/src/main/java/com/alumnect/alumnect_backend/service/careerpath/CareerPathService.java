package com.alumnect.alumnect_backend.service.careerpath;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathDetailResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathSummaryResponse;

public interface CareerPathService {
    PageResponse<CareerPathSummaryResponse> getCareerPaths(
            String search,
            String title,
            String company,
            String location,
            Integer cohort,
            Long majorId,
            int page,
            int size
    );

    CareerPathDetailResponse getCareerPathDetail(Long userId);
}
