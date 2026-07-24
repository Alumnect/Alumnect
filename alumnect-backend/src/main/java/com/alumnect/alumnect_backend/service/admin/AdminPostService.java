package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminPostResponse;

/**
 * Interface định nghĩa các dịch vụ quản trị và kiểm duyệt bài viết dành cho Admin.
 */
public interface AdminPostService {

    /**
     * Lấy danh sách bài viết phân trang và lọc động theo từ khóa, tác giả, trạng thái.
     *
     * @param query Từ khóa tìm kiếm trong nội dung
     * @param author Từ khóa tìm kiếm theo tên/email tác giả
     * @param status Trạng thái ẩn (VISIBLE, HIDDEN, hoặc ALL)
     * @param page Số trang hiển thị (0-based)
     * @param size Số lượng phần tử mỗi trang
     * @return Phân trang danh sách bài viết dạng DTO
     */
    PageResponse<AdminPostResponse> getPosts(String query, String author, String status, int page, int size);

    /**
     * Thay đổi trạng thái ẩn (Hide / Unhide) của bài viết vi phạm (UC68).
     *
     * @param id ID bài viết cần sửa trạng thái
     * @param isHidden true nếu muốn ẩn bài viết, false nếu muốn hiển thị lại
     */
    void togglePostHidden(Long id, boolean isHidden);
}
