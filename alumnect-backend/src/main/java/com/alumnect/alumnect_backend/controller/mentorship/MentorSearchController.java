package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorSearchCriteria;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorCardResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorFilterOptionsResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorSearchService;
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

import java.util.List;

/**
 * Controller tiếp nhận và xử lý các yêu cầu Tìm kiếm & Lọc Mentor (UC98).
 * Cung cấp API tìm kiếm đa tiêu chí (từ khóa, ngành nghề, chuyên ngành, kỹ năng, hình thức, loại hình cố vấn)
 * và API lấy danh mục các tùy chọn bộ lọc cho sinh viên và người học.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping({"/mentors", "/mentoring/search"})
@RequiredArgsConstructor
@Tag(name = "Mentor Search & Filter", description = "Các API phục vụ Tìm kiếm & Lọc Mentor (UC98)")
public class MentorSearchController {

    private final MentorSearchService mentorSearchService;

    /**
     * API Tìm kiếm & Lọc danh sách Mentor có phân trang.
     * Hỗ trợ tìm kiếm theo từ khóa kết hợp đa bộ lọc theo quy tắc logic AND liên nhóm.
     * Chỉ trả về các Mentor có trạng thái ACTIVE và gói đăng ký còn hiệu lực.
     *
     * @param keyword Từ khóa tìm kiếm tự do (họ tên, tiêu đề, giới thiệu, chủ đề, kỹ năng, công ty, vị trí)
     * @param fieldId ID của lĩnh vực chuyên môn (ngành nghề / Industry)
     * @param industryId Bí danh tương đương của fieldId
     * @param specialization Tên hoặc mã chuyên ngành học (Specialization / Major)
     * @param specializationId ID của chuyên ngành học
     * @param majorId Bí danh tương đương của specializationId
     * @param skill Tên một kỹ năng chuyên môn cần lọc
     * @param skills Danh sách nhiều kỹ năng chuyên môn cần lọc
     * @param workingMode Hình thức làm việc / hướng dẫn (ONLINE, OFFLINE, BOTH)
     * @param mentoringType Loại hình cố vấn (INDIVIDUAL, GROUP, BOTH)
     * @param sortBy Tiêu chí sắp xếp (reputationScore, rating, completedTasks, newest - mặc định: reputationScore)
     * @param sortDirection Hướng sắp xếp (DESC hoặc ASC - mặc định: DESC)
     * @param page Chỉ số trang hiện tại (0-indexed, mặc định: 0)
     * @param size Số lượng Mentor trên một trang (mặc định: 10, tối đa: 50)
     * @return ResponseEntity chứa ApiResponse bọc đối tượng PageResponse&lt;MentorCardResponse&gt;
     */
    @GetMapping
    @Operation(
            summary = "Tìm kiếm & Lọc Mentor",
            description = "Truy vấn danh sách Mentor ACTIVE theo từ khóa và các bộ lọc kết hợp (Field, Specialization, Skills, Working Mode, Mentoring Type) có phân trang"
    )
    public ResponseEntity<ApiResponse<PageResponse<MentorCardResponse>>> searchMentors(
            @Parameter(description = "Từ khóa tìm kiếm (họ tên, headline, bio, kỹ năng, công ty...)")
            @RequestParam(name = "keyword", required = false) String keyword,

            @Parameter(description = "ID của lĩnh vực chuyên môn / ngành nghề")
            @RequestParam(name = "fieldId", required = false) Long fieldId,

            @Parameter(description = "Bí danh ID của ngành nghề (tương đương fieldId)")
            @RequestParam(name = "industryId", required = false) Long industryId,

            @Parameter(description = "Tên hoặc mã chuyên ngành học (SE, AI, Kỹ thuật phần mềm...)")
            @RequestParam(name = "specialization", required = false) String specialization,

            @Parameter(description = "ID của chuyên ngành học (majors.id)")
            @RequestParam(name = "specializationId", required = false) Long specializationId,

            @Parameter(description = "Bí danh ID chuyên ngành (tương đương specializationId)")
            @RequestParam(name = "majorId", required = false) Long majorId,

            @Parameter(description = "Tên một kỹ năng chuyên môn cần lọc")
            @RequestParam(name = "skill", required = false) String skill,

            @Parameter(description = "Danh sách kỹ năng cần lọc")
            @RequestParam(name = "skills", required = false) List<String> skills,

            @Parameter(description = "Hình thức làm việc: ONLINE, OFFLINE, BOTH")
            @RequestParam(name = "workingMode", required = false) MentoringWorkingMode workingMode,

            @Parameter(description = "Loại hình cố vấn: INDIVIDUAL, GROUP, BOTH")
            @RequestParam(name = "mentoringType", required = false) MentoringType mentoringType,

            @Parameter(description = "Tiêu chí sắp xếp: reputationScore, rating, completedTasks, newest")
            @RequestParam(name = "sortBy", defaultValue = "reputationScore") String sortBy,

            @Parameter(description = "Hướng sắp xếp: DESC, ASC")
            @RequestParam(name = "sortDirection", defaultValue = "DESC") String sortDirection,

            @Parameter(description = "Chỉ số trang (bắt đầu từ 0)")
            @RequestParam(name = "page", defaultValue = "0") int page,

            @Parameter(description = "Số lượng bản ghi trên một trang (1-50)")
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        log.info("Client gọi API tìm kiếm & lọc Mentor: keyword='{}', fieldId={}, specialization='{}', workingMode={}, mentoringType={}, page={}, size={}",
                keyword, (fieldId != null ? fieldId : industryId), specialization, workingMode, mentoringType, page, size);

        Long effectiveFieldId = fieldId != null ? fieldId : industryId;
        Long effectiveSpecId = specializationId != null ? specializationId : majorId;

        MentorSearchCriteria criteria = MentorSearchCriteria.builder()
                .keyword(keyword)
                .fieldId(effectiveFieldId)
                .specialization(specialization)
                .specializationId(effectiveSpecId)
                .skill(skill)
                .skills(skills)
                .workingMode(workingMode)
                .mentoringType(mentoringType)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Pageable pageable = PageRequest.of(page, size);
        PageResponse<MentorCardResponse> response = mentorSearchService.searchMentors(criteria, pageable);

        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm danh sách Mentor thành công", response));
    }

    /**
     * API Lấy danh mục các tùy chọn bộ lọc động phục vụ giao diện người dùng.
     * Cung cấp danh sách các ngành nghề (Industry), chuyên ngành (Major), hình thức và loại hình cố vấn.
     *
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentorFilterOptionsResponse
     */
    @GetMapping({"/filter-options", "/options"})
    @Operation(
            summary = "Lấy tùy chọn bộ lọc Mentor",
            description = "Lấy danh mục dữ liệu thực tế gồm các ngành nghề, chuyên ngành, hình thức và loại hình để đổ vào các component bộ lọc giao diện"
    )
    public ResponseEntity<ApiResponse<MentorFilterOptionsResponse>> getFilterOptions() {
        log.info("Client yêu cầu danh mục tùy chọn bộ lọc Mentor");
        MentorFilterOptionsResponse options = mentorSearchService.getFilterOptions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục tùy chọn bộ lọc thành công", options));
    }
}
