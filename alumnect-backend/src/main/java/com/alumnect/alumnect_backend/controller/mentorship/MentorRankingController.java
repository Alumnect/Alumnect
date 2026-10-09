package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRankingResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý yêu cầu Xem bảng xếp hạng Mentor theo lĩnh vực chuyên môn (UC97).
 * Cung cấp API truy vấn danh sách Mentor xuất sắc theo từng ngành nghề, phục vụ sinh viên và cựu sinh viên.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping({"/mentoring/ranking", "/mentors/ranking"})
@RequiredArgsConstructor
@Tag(name = "Mentor Ranking", description = "Các API phục vụ Xem bảng xếp hạng Mentor theo lĩnh vực (UC97)")
public class MentorRankingController {

    private final MentorRankingService mentorRankingService;

    /**
     * API Lấy bảng xếp hạng Mentor theo từng lĩnh vực chuyên môn với phân trang.
     * Hỗ trợ hai đường dẫn chuẩn: GET /api/v1/mentoring/ranking và GET /api/v1/mentors/ranking.
     *
     * @param fieldId ID của lĩnh vực chuyên môn (ngành nghề / Industry) - Bắt buộc
     * @param page Số trang hiện tại (0-indexed, mặc định: 0)
     * @param size Số lượng Mentor trên một trang (mặc định: 10, tối đa: 50)
     * @return ResponseEntity chứa ApiResponse bọc đối tượng PageResponse&lt;MentorRankingResponse&gt;
     */
    @GetMapping
    @Operation(
            summary = "Xem bảng xếp hạng Mentor theo lĩnh vực",
            description = "Truy vấn danh sách Mentor ACTIVE có gói dịch vụ còn hiệu lực, sắp xếp theo thuật toán xếp hạng uy tín trong lĩnh vực chỉ định"
    )
    public ResponseEntity<ApiResponse<PageResponse<MentorRankingResponse>>> getMentorRanking(
            @Parameter(description = "ID của lĩnh vực chuyên môn (ngành nghề)", required = true)
            @RequestParam(name = "fieldId") Long fieldId,

            @Parameter(description = "Chỉ số trang (bắt đầu từ 0)")
            @RequestParam(name = "page", defaultValue = "0") int page,

            @Parameter(description = "Số lượng bản ghi trên mỗi trang (1-50)")
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        log.info("Client yêu cầu bảng xếp hạng Mentor: fieldId={}, page={}, size={}", fieldId, page, size);

        int sanitizedPage = Math.max(0, page);
        int sanitizedSize = (size <= 0 || size > 50) ? 10 : size;

        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize);
        PageResponse<MentorRankingResponse> result = mentorRankingService.getMentorRanking(fieldId, pageable);

        return ResponseEntity.ok(ApiResponse.success("Lấy bảng xếp hạng Mentor thành công", result));
    }
}
