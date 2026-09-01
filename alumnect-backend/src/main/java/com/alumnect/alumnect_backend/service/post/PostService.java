package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.post.CreateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.request.post.EditPostRequest;
import com.alumnect.alumnect_backend.dto.request.post.UpdateCommentRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;

/**
 * Interface định nghĩa các dịch vụ liên quan tới bài viết cộng đồng
 * (UC14 - Create a post, UC15 - View community Feed, UC16 - View Post Detail, UC17 - Like a post,
 * UC18 - Comment on a post).
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
     * bài viết chưa bị ẩn (BR-12). Cờ {@code liked} của mỗi bài được tính theo người xem hiện tại (UC17).
     * Hỗ trợ tìm kiếm theo từ khóa.
     *
     * @param page            Số thứ tự trang cần lấy (0-based)
     * @param size            Kích thước trang (số bài viết mỗi trang)
     * @param type            Loại bài viết cần lọc ("normal"/"achievement"/"recruitment"/"event"),
     *                        hoặc null/rỗng nếu không lọc theo loại
     * @param keyword         Từ khóa tìm kiếm trên nội dung bài viết và tên tác giả
     * @param isAuthenticated true nếu người xem đã đăng nhập, false nếu là Guest
     * @param viewerEmail     Email người xem đã đăng nhập (để tính cờ liked); null nếu là Guest
     * @return Trang kết quả bài viết đã được chuẩn hóa, sẵn sàng trả về Client
     */
    PageResponse<PostResponse> getFeed(int page, int size, String type, String keyword, boolean isAuthenticated, String viewerEmail);

    /**
     * Lấy chi tiết một bài viết theo ID (UC16 - View Post Detail), áp dụng quy tắc quyền xem:
     * bài đã ẩn/không tồn tại → 404 (BR-08/BR-11); Guest xem bài MEMBERS → 403 (BR-12).
     * Cờ {@code liked} được tính theo người xem hiện tại (UC17).
     *
     * @param id              ID bài viết cần xem chi tiết
     * @param isAuthenticated true nếu người xem đã đăng nhập, false nếu là Guest
     * @param viewerEmail     Email người xem đã đăng nhập (để tính cờ liked); null nếu là Guest
     * @return Chi tiết bài viết đã được chuẩn hóa
     */
    PostResponse getPostDetail(Long id, boolean isAuthenticated, String viewerEmail);

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

    /**
     * Đăng một bình luận mới trên bài viết (UC18 - Comment on a post).
     * Chỉ STUDENT/ALUMNI đã đăng nhập được bình luận (vai trò khác → 403);
     * bài đã ẩn/không tồn tại → 404. Cập nhật đồng thời bộ đếm {@code comment_count} của bài viết.
     *
     * @param email   Email người dùng đang đăng nhập (từ JWT) — tác giả bình luận
     * @param postId  ID bài viết được bình luận
     * @param request Dữ liệu bình luận (nội dung, và {@code parentId} nếu là trả lời)
     * @return Bình luận vừa tạo đã được chuẩn hóa thành {@link CommentResponse}
     */
    CommentResponse createComment(String email, Long postId, CreateCommentRequest request);

    /**
     * Chỉnh sửa nội dung một bình luận đã đăng (UC19 - Edit a comment).
     * Chỉ tác giả có vai trò STUDENT hoặc ALUMNI được chỉnh sửa bình luận ACTIVE của chính mình.
     *
     * @param email     Email người dùng đang đăng nhập, lấy từ JWT
     * @param postId    ID bài viết chứa bình luận
     * @param commentId ID bình luận cần chỉnh sửa
     * @param request   Nội dung mới đã được Controller xác thực dữ liệu
     * @return Bình luận sau khi cập nhật, chuẩn hóa thành {@link CommentResponse}
     */
    CommentResponse updateComment(String email, Long postId, Long commentId, UpdateCommentRequest request);

    /**
     * Xóa mềm một bình luận đã đăng (UC20 - Delete a comment).
     * Chỉ tác giả có vai trò STUDENT hoặc ALUMNI được xóa bình luận ACTIVE của chính mình.
     *
     * @param email     Email người dùng đang đăng nhập, lấy từ JWT
     * @param postId    ID bài viết chứa bình luận
     * @param commentId ID bình luận cần xóa
     */
    void deleteComment(String email, Long postId, Long commentId);

    /**
     * Thích một bài viết (UC17 - Like a post). Chỉ STUDENT/ALUMNI đã đăng nhập được thích;
     * thao tác có tính lũy đẳng (đã thích rồi thì không thay đổi). Bài đã ẩn/không tồn tại → 404.
     *
     * @param email  Email người dùng đang đăng nhập (từ JWT)
     * @param postId ID bài viết cần thích
     * @return Trạng thái like mới ({@code liked=true}) và số lượt thích hiện tại
     */
    LikeResponse likePost(String email, Long postId);

    /**
     * Bỏ thích một bài viết (UC17 - Like a post). Chỉ STUDENT/ALUMNI đã đăng nhập được bỏ thích;
     * thao tác có tính lũy đẳng (chưa thích thì không thay đổi). Bài đã ẩn/không tồn tại → 404.
     *
     * @param email  Email người dùng đang đăng nhập (từ JWT)
     * @param postId ID bài viết cần bỏ thích
     * @return Trạng thái like mới ({@code liked=false}) và số lượt thích hiện tại
     */
    LikeResponse unlikePost(String email, Long postId);

    /**
     * Chỉnh sửa một bài viết đã đăng (UC22 - Edit a post).
     * Chỉ tác giả (STUDENT/ALUMNI) mới được sửa bài viết của chính mình;
     * người khác hoặc Admin → 403. Bài đã ẩn/không tồn tại → 404.
     *
     * @param email   Email người dùng đang đăng nhập (từ JWT) — phải là tác giả bài viết
     * @param postId  ID bài viết cần chỉnh sửa
     * @param request Dữ liệu cập nhật (nội dung, loại, ảnh, phạm vi hiển thị)
     * @return Bài viết đã được cập nhật, chuẩn hóa thành {@link PostResponse}
     */
    PostResponse editPost(String email, Long postId, EditPostRequest request);

    /**
     * Xóa một bài viết (UC23 - Delete a post).
     * Chỉ tác giả (STUDENT/ALUMNI) mới được xóa bài viết của chính mình;
     * người khác hoặc Admin → 403. Bài đã xóa/không tồn tại → 404.
     * Cập nhật trạng thái thành DELETED để ẩn khỏi bảng tin.
     *
     * @param email  Email người dùng đang đăng nhập (từ JWT) — phải là tác giả bài viết
     * @param postId ID bài viết cần xóa
     */
    void deletePost(String email, Long postId);

    /**
     * Lưu/đánh dấu (bookmark) một bài viết (UC20 - Save Post).
     * Chỉ STUDENT/ALUMNI đã đăng nhập được lưu; thao tác có tính lũy đẳng (đã lưu rồi thì không thay đổi).
     * Bài viết đã ẩn/xóa/không tồn tại → 404.
     *
     * @param email  Email người dùng đang đăng nhập (từ JWT)
     * @param postId ID bài viết cần lưu
     * @return Trạng thái lưu mới ({@code saved=true})
     */
    com.alumnect.alumnect_backend.dto.response.post.SavePostResponse savePost(String email, Long postId);

    /**
     * Bỏ lưu/bỏ đánh dấu một bài viết (UC20 - Save Post).
     * Chỉ STUDENT/ALUMNI đã đăng nhập được bỏ lưu; thao tác có tính lũy đẳng (chưa lưu thì không thay đổi).
     * Bài viết đã ẩn/xóa/không tồn tại → 404.
     *
     * @param email  Email người dùng đang đăng nhập (từ JWT)
     * @param postId ID bài viết cần bỏ lưu
     * @return Trạng thái lưu mới ({@code saved=false})
     */
    com.alumnect.alumnect_backend.dto.response.post.SavePostResponse unsavePost(String email, Long postId);

    /**
     * Lấy danh sách các bài viết đã lưu của người dùng hiện tại (UC20 - View Saved Posts).
     * Yêu cầu người dùng đăng nhập với vai trò STUDENT hoặc ALUMNI.
     * Danh sách được phân trang và sắp xếp theo thời gian lưu mới nhất trước.
     *
     * @param email Email người dùng đang đăng nhập (từ JWT)
     * @param page  Số thứ tự trang cần lấy (0-based)
     * @param size  Kích thước trang (số bài viết mỗi trang)
     * @return Trang kết quả các bài viết đã lưu
     */
    PageResponse<PostResponse> getSavedPosts(String email, int page, int size);

    /**
     * Lấy danh sách bài viết của một user theo ID.
     */
    PageResponse<PostResponse> getUserPosts(Long userId, String category, int page, int size, String viewerEmail);
}
