package com.alumnect.alumnect_backend.controller.careerpath;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathDetailResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathSummaryResponse;
import com.alumnect.alumnect_backend.service.careerpath.CareerPathService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/career-paths")
@RequiredArgsConstructor
@Slf4j
public class CareerPathController {

    private final CareerPathService careerPathService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CareerPathSummaryResponse>>> getCareerPaths(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer cohort,
            @RequestParam(required = false) Long majorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Nhận yêu cầu HTTP GET lấy danh sách Career Paths: page={}, size={}", page, size);
        PageResponse<CareerPathSummaryResponse> result = careerPathService.getCareerPaths(
                search, title, company, location, cohort, majorId, page, size
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Career Paths thành công", result));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<CareerPathDetailResponse>> getCareerPathDetail(
            @PathVariable Long userId
    ) {
        log.info("Nhận yêu cầu HTTP GET lấy chi tiết Career Path cho user: {}", userId);
        CareerPathDetailResponse result = careerPathService.getCareerPathDetail(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết Career Path thành công", result));
    }
}
