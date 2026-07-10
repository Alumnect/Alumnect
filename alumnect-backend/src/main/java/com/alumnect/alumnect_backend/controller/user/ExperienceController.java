package com.alumnect.alumnect_backend.controller.user;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.user.ExperienceRequest;
import com.alumnect.alumnect_backend.dto.request.user.PromotionRequest;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.service.user.ExperienceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/experiences")
@RequiredArgsConstructor
@Slf4j
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExperienceResponse>>> getOwnExperiences() {
        String email = getAuthenticatedUserEmail();
        log.info("Lấy danh sách kinh nghiệm của user: {}", email);
        List<ExperienceResponse> result = experienceService.getOwnExperiences(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách kinh nghiệm thành công", result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExperienceResponse>> createExperience(@Valid @RequestBody ExperienceRequest request) {
        String email = getAuthenticatedUserEmail();
        log.info("Tạo kinh nghiệm mới cho user: {}", email);
        ExperienceResponse result = experienceService.createExperience(email, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo kinh nghiệm làm việc thành công", result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExperienceResponse>> updateExperience(
            @PathVariable Long id,
            @Valid @RequestBody ExperienceRequest request
    ) {
        String email = getAuthenticatedUserEmail();
        log.info("Cập nhật kinh nghiệm id={} cho user: {}", id, email);
        ExperienceResponse result = experienceService.updateExperience(email, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kinh nghiệm làm việc thành công", result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExperience(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        log.info("Xóa kinh nghiệm id={} của user: {}", id, email);
        experienceService.deleteExperience(email, id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kinh nghiệm làm việc thành công", null));
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<ExperienceResponse>> promoteExperience(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequest request
    ) {
        String email = getAuthenticatedUserEmail();
        log.info("Thăng chức vai trò từ kinh nghiệm id={} của user: {}", id, email);
        ExperienceResponse result = experienceService.promoteExperience(email, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò mới thành công", result));
    }

    private String getAuthenticatedUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
