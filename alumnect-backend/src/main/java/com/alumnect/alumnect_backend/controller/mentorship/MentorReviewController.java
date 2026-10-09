package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorReviewRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorReviewResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorReputationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller tiếp nhận đánh giá từ học viên và cập nhật điểm uy tín Mentor.
 */
@RestController
@RequestMapping("/api/v1/mentoring/reviews")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mentor Reviews & Reputation", description = "API đánh giá và tính điểm uy tín Mentor (UC97)")
public class MentorReviewController {

    private final MentorReputationService mentorReputationService;

    @Operation(summary = "Học viên gửi đánh giá cho Mentor (1-5 sao)")
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MentorReviewResponse>> submitReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MentorReviewRequest request) {

        log.info("Nhận yêu cầu đánh giá Mentor: studentEmail={}, mentorProfileId={}, rating={}",
                userDetails.getUsername(), request.getMentorProfileId(), request.getRating());

        MentorReviewResponse response = mentorReputationService.submitMentorReview(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
