package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminReportResponse;

/**
 * Interface định nghĩa các dịch vụ quản lý báo cáo vi phạm dành cho Admin.
 */
public interface AdminReportService {

    /**
     * Lấy danh sách báo cáo vi phạm phân trang và lọc động.
     *
     * @param query Từ khóa tìm kiếm (trong nội dung bài viết, người báo cáo, hoặc tác giả bài viết)
     * @param reason Lý do báo cáo
     * @param status Trạng thái của báo cáo (PENDING, RESOLVED, DISMISSED)
     * @param postId ID bài viết bị báo cáo (tùy chọn)
     * @param page Số trang hiển thị (0-based)
     * @param size Số lượng phần tử mỗi trang
     * @return Trang danh sách báo cáo vi phạm dạng DTO bọc trong PageResponse
     */
    PageResponse<AdminReportResponse> getReports(String query, String reason, String status, Long postId, int page, int size);

    /**
     * Cập nhật trạng thái của báo cáo vi phạm (RESOLVED hoặc DISMISSED).
     *
     * @param id ID của báo cáo cần cập nhật
     * @param status Trạng thái mới của báo cáo
     */
    void updateReportStatus(Long id, String status);
}
