package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminReportResponse;
import com.alumnect.alumnect_backend.service.admin.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller xử lý các yêu cầu quản trị và kiểm duyệt báo cáo vi phạm dành cho Quản trị viên (Admin).
 */
@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService adminReportService;

    /**
     * Lấy danh sách báo cáo vi phạm phân trang và lọc động (UC69).
     *
     * @param query Từ khóa tìm kiếm nội dung bài viết, người báo cáo, hoặc tác giả (tùy chọn)
     * @param reason Lý do báo cáo vi phạm: SPAM, INAPPROPRIATE, MISINFORMATION, SCAM_OR_FRAUD, OTHER (tùy chọn)
     * @param status Trạng thái xử lý báo cáo: PENDING, RESOLVED, DISMISSED (tùy chọn)
     * @param postId ID bài viết bị báo cáo (tùy chọn)
     * @param page Số trang hiển thị, mặc định 0
     * @param size Số lượng phần tử mỗi trang, mặc định 10
     * @return Trang danh sách báo cáo bọc trong ApiResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminReportResponse>>> getReports(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<AdminReportResponse> reports = adminReportService.getReports(query, reason, status, postId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách báo cáo vi phạm thành công", reports));
    }

    /**
     * Cập nhật trạng thái xử lý báo cáo vi phạm (RESOLVED hoặc DISMISSED).
     *
     * @param id ID của báo cáo cần cập nhật
     * @param payload Map chứa trạng thái mới mong muốn {"status": "RESOLVED" / "DISMISSED"}
     * @return Kết quả thành công bọc trong ApiResponse
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        String status = payload.get("status");
        adminReportService.updateReportStatus(id, status);
        String msg = "DISMISSED".equalsIgnoreCase(status) ? "Đã bỏ qua báo cáo vi phạm" : "Đã giải quyết báo cáo vi phạm";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }
}
