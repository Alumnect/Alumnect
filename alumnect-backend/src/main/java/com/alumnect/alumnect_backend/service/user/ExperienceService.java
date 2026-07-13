package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.dto.request.user.ExperienceRequest;
import com.alumnect.alumnect_backend.dto.request.user.PromotionRequest;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;

import java.util.List;

public interface ExperienceService {
    List<ExperienceResponse> getOwnExperiences(String email);
    ExperienceResponse createExperience(String email, ExperienceRequest request);
    ExperienceResponse updateExperience(String email, Long id, ExperienceRequest request);
    void deleteExperience(String email, Long id);
    ExperienceResponse promoteExperience(String email, Long id, PromotionRequest request);
}
