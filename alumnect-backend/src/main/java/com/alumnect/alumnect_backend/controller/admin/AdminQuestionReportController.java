package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminQuestionReportResponse;
import com.alumnect.alumnect_backend.service.report.QuestionReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller xử lý các yêu cầu kiểm duyệt câu hỏi vi phạm dành cho Quản trị viên (UC78).
 */
@RestController
@RequestMapping("/admin/reports/questions")
@RequiredArgsConstructor
public class AdminQuestionReportController {

    private final QuestionReportService questionReportService;

    /**
     * Lấy danh sách báo cáo câu hỏi vi phạm phân trang và lọc động (UC78).
     *
     * @param query Từ khóa tìm kiếm nội dung/tiêu đề câu hỏi, người báo cáo, tác giả (tùy chọn)
     * @param reason Lý do vi phạm: SPAM, INAPPROPRIATE, MISINFORMATION, SCAM_OR_FRAUD, OTHER (tùy chọn)
     * @param status Trạng thái xử lý: PENDING, RESOLVED, DISMISSED (tùy chọn)
     * @param topicId ID chủ đề diễn đàn (tùy chọn)
     * @param page Số trang hiển thị, mặc định 0
     * @param size Số lượng phần tử mỗi trang, mặc định 10
     * @return Trang danh sách báo cáo bọc trong ApiResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminQuestionReportResponse>>> getViolatingQuestions(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long topicId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<AdminQuestionReportResponse> reports = questionReportService.getViolatingQuestions(query, reason, status, topicId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách câu hỏi vi phạm thành công", reports));
    }

    /**
     * Cập nhật trạng thái xử lý báo cáo câu hỏi vi phạm (RESOLVED hoặc DISMISSED) và ẩn/hiện câu hỏi.
     *
     * @param id ID của báo cáo cần cập nhật
     * @param payload Map chứa trạng thái mới {"status": "RESOLVED" / "DISMISSED", "hideQuestion": true/false}
     * @return Kết quả thành công bọc trong ApiResponse
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        String status = (String) payload.get("status");
        Boolean hideQuestion = payload.containsKey("hideQuestion") ? (Boolean) payload.get("hideQuestion") : null;

        questionReportService.updateReportStatus(id, status, hideQuestion);
        String msg = "DISMISSED".equalsIgnoreCase(status) ? "Đã bỏ qua báo cáo câu hỏi vi phạm" : "Đã giải quyết báo cáo câu hỏi vi phạm";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }
}
