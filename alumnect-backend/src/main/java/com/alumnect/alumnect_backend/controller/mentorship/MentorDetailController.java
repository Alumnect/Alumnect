package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorDetailResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorDetailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý yêu cầu Xem chi tiết Mentor (UC99 — View Mentor Detail).
 * Cung cấp API trả về đầy đủ thông tin công khai, chuyên môn, kỹ năng, kinh nghiệm và tính khả dụng của Mentor.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping({"/mentors", "/mentoring/mentors"})
@RequiredArgsConstructor
@Tag(name = "Mentor Detail", description = "Các API phục vụ Xem chi tiết Mentor (UC99)")
public class MentorDetailController {

    private final MentorDetailService mentorDetailService;

    /**
     * API Xem chi tiết hồ sơ công khai của một Mentor theo định danh.
     * Hỗ trợ hai đường dẫn chuẩn:
     * - GET /api/v1/mentors/{mentorId}
     * - GET /api/v1/mentoring/mentors/{mentorId}
     * Ràng buộc regex {mentorId:\\d+} để phân biệt rõ ràng với các subpath chữ như /filter-options.
     *
     * @param mentorId Định danh số nguyên của Mentor (mentorProfileId hoặc userId)
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentorDetailResponse
     */
    @GetMapping({"/{mentorId:\\d+}", "/detail/{mentorId:\\d+}"})
    @Operation(
            summary = "Xem chi tiết hồ sơ Mentor",
            description = "Truy xuất toàn bộ thông tin công khai, chuyên môn, kinh nghiệm, lĩnh vực hỗ trợ, điểm uy tín và trạng thái sẵn sàng nhận yêu cầu cố vấn của Mentor"
    )
    public ResponseEntity<ApiResponse<MentorDetailResponse>> getMentorDetail(
            @Parameter(description = "Định danh số của Mentor (ID hồ sơ mentor_profiles hoặc ID tài khoản users)", required = true)
            @PathVariable("mentorId") Long mentorId
    ) {
        log.info("Client yêu cầu xem chi tiết hồ sơ Mentor với mentorId={}", mentorId);

        MentorDetailResponse response = mentorDetailService.getMentorDetail(mentorId);

        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết Mentor thành công", response));
    }
}
