package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;

/**
 * Interface định nghĩa các dịch vụ liên quan tới bảng tin cộng đồng (UC15 - View community Feed).
 */
public interface PostService {

    /**
     * Lấy một trang bài viết cho bảng tin cộng đồng, áp dụng phân quyền theo vai trò người xem:
     * Guest (chưa đăng nhập) chỉ thấy bài viết PUBLIC, thành viên đã đăng nhập thấy toàn bộ
     * bài viết chưa bị ẩn (BR-12).
     *
     * @param page            Số thứ tự trang cần lấy (0-based)
     * @param size            Kích thước trang (số bài viết mỗi trang)
     * @param type            Loại bài viết cần lọc ("normal"/"achievement"/"recruitment"/"event"),
     *                        hoặc null/rỗng nếu không lọc theo loại
     * @param isAuthenticated true nếu người xem đã đăng nhập, false nếu là Guest
     * @return Trang kết quả bài viết đã được chuẩn hóa, sẵn sàng trả về Client
     */
    PageResponse<PostResponse> getFeed(int page, int size, String type, boolean isAuthenticated);
}
