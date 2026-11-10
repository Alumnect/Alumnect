package com.alumnect.alumnect_backend.controller.careerpath;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.careerpath.CareerAiCompareRequest;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerAiCompareResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathDetailResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathSummaryResponse;
import com.alumnect.alumnect_backend.service.careerpath.CareerPathAiService;
import com.alumnect.alumnect_backend.service.careerpath.CareerPathService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/career-paths")
@RequiredArgsConstructor
@Slf4j
public class CareerPathController {

    private final CareerPathService careerPathService;
    private final CareerPathAiService careerPathAiService;

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

    /**
     * [C2] AI đối chiếu lộ trình 1-chạm giữa người xem (từ JWT) và một cựu sinh viên bất kỳ.
     * Toàn bộ các API Career Path chỉ cho phép Sinh viên (STUDENT) và Cựu sinh viên (ALUMNI) truy cập.
     */
    @PostMapping("/ai-compare")
    public ResponseEntity<ApiResponse<CareerAiCompareResponse>> aiCompare(
            @Valid @RequestBody CareerAiCompareRequest request,
            Authentication authentication
    ) {
        log.info("Nhận yêu cầu HTTP POST AI so sánh lộ trình: targetUserId={}", request.getTargetUserId());
        CareerAiCompareResponse result = careerPathAiService.compare(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("So sánh lộ trình thành công", result));
    }
}
