package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;

/**
 * Interface định nghĩa các dịch vụ liên quan tới bài viết cộng đồng
 * (UC14 - Create a post, UC15 - View community Feed, UC16 - View Post Detail).
 */
public interface PostService {

    /**
     * Tạo một bài viết mới trên bảng tin cộng đồng (UC14 - Create a post on the Feed).
     * Chỉ Sinh viên (STUDENT) và Cựu sinh viên (ALUMNI) đã đăng nhập mới được đăng bài;
     * Admin hoặc vai trò khác bị từ chối với lỗi 403.
     *
     * @param email   Email tài khoản đang đăng nhập (lấy từ JWT) — tác giả bài viết
     * @param request Dữ liệu bài viết (nội dung, loại, ảnh, phạm vi hiển thị)
     * @return Bài viết vừa tạo đã được chuẩn hóa thành {@link PostResponse}
     */
    PostResponse createPost(String email, CreatePostRequest request);

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

    /**
     * Lấy chi tiết một bài viết theo ID (UC16 - View Post Detail), áp dụng quy tắc quyền xem:
     * bài đã ẩn/không tồn tại → 404 (BR-08/BR-11); Guest xem bài MEMBERS → 403 (BR-12).
     *
     * @param id              ID bài viết cần xem chi tiết
     * @param isAuthenticated true nếu người xem đã đăng nhập, false nếu là Guest
     * @return Chi tiết bài viết đã được chuẩn hóa
     */
    PostResponse getPostDetail(Long id, boolean isAuthenticated);

    /**
     * Lấy một trang bình luận (chỉ đọc) của một bài viết (UC16 - View Post Detail).
     * Áp dụng cùng quy tắc quyền xem như {@link #getPostDetail} trên bài viết chứa bình luận,
     * để Guest không đọc được bình luận của bài MEMBERS.
     *
     * @param postId          ID bài viết cần lấy bình luận
     * @param page            Số thứ tự trang cần lấy (0-based)
     * @param size            Kích thước trang (số bình luận mỗi trang)
     * @param isAuthenticated true nếu người xem đã đăng nhập, false nếu là Guest
     * @return Trang kết quả bình luận đã được chuẩn hóa
     */
    PageResponse<CommentResponse> getPostComments(Long postId, int page, int size, boolean isAuthenticated);
}
