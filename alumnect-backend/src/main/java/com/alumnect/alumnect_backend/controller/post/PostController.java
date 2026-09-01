package com.alumnect.alumnect_backend.controller.post;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.post.CreateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.request.post.EditPostRequest;
import com.alumnect.alumnect_backend.dto.request.post.UpdateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.report.CreatePostReportRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.dto.response.post.SavePostResponse;
import com.alumnect.alumnect_backend.dto.response.report.ReportResponse;
import com.alumnect.alumnect_backend.service.post.PostService;
import com.alumnect.alumnect_backend.service.report.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các yêu cầu liên quan đến bài viết cộng đồng
 * (UC15 - View community Feed, UC16 - View Post Detail).
 * Được map tự động với prefix global /api/v1/posts.
 * <p>
 * Endpoint được khai báo công khai (xem {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET}) để
 * Guest chưa đăng nhập vẫn xem được bảng tin ở chế độ chỉ đọc (BR-12);
 * {@link com.alumnect.alumnect_backend.security.filter.JwtFilter} vẫn giải mã và gán {@link Authentication}
 * vào Security Context nếu request có kèm Bearer token hợp lệ, nhờ đó Controller phân biệt được
 * Guest và thành viên đã đăng nhập để lọc dữ liệu phù hợp.
 */
@RestController
@RequestMapping("/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private ReportService reportService;

    /**
     * API lấy một trang bài viết trên bảng tin cộng đồng.
     * Guest (không có/không kèm JWT hợp lệ) chỉ nhận được bài viết công khai (PUBLIC);
     * thành viên đã đăng nhập (Student/Alumni/Admin) nhận toàn bộ bài viết chưa bị ẩn.
     *
     * @param page           Số thứ tự trang cần lấy (0-based), mặc định 0
     * @param size           Kích thước trang, mặc định 5
     * @param sort           Tiêu chí sắp xếp — hiện chỉ hỗ trợ "recent" (mới nhất trước), tham số dự phòng cho tương lai
     * @param type           Loại bài viết cần lọc ("normal"/"achievement"/"recruitment"/"event"), bỏ trống nếu không lọc
     * @param authentication Thông tin xác thực do Spring Security tự động cung cấp — null hoặc AnonymousAuthenticationToken nếu là Guest
     * @return Trang kết quả bài viết {@link PostResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(required = false) String type,
            Authentication authentication) {

        boolean authenticated = isAuthenticated(authentication);
        String viewerEmail = authenticated ? authentication.getName() : null;
        PageResponse<PostResponse> feed = postService.getFeed(page, size, type, authenticated, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Lấy bảng tin thành công", feed));
    }

    /**
     * API tạo một bài viết mới trên bảng tin cộng đồng (UC14 - Create a post on the Feed).
     * Yêu cầu đăng nhập (JWT); chỉ Sinh viên/Cựu sinh viên được đăng bài — Admin/vai trò khác nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller.
     *
     * @param request        DTO chứa nội dung, loại, ảnh và phạm vi hiển thị của bài viết
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email tác giả
     * @return Bài viết vừa tạo {@link PostResponse} bọc trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {

        PostResponse created = postService.createPost(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng bài viết thành công", created));
    }

    /**
     * API chỉnh sửa bài viết đã đăng (UC22 - Edit a post).
     * Yêu cầu đăng nhập (JWT); chỉ tác giả (Sinh viên/Cựu sinh viên) mới được sửa bài
     * của chính mình — người khác hoặc Admin nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller.
     *
     * @param id             ID bài viết cần chỉnh sửa
     * @param request        DTO chứa nội dung mới, loại, ảnh và phạm vi hiển thị
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email tác giả
     * @return Bài viết đã được cập nhật {@link PostResponse} bọc trong {@link ApiResponse}, HTTP 200 OK
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> editPost(
            @PathVariable Long id,
            @Valid @RequestBody EditPostRequest request,
            Authentication authentication) {

        PostResponse updated = postService.editPost(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Chỉnh sửa bài viết thành công", updated));
    }

    /**
     * API lấy chi tiết một bài viết theo ID (UC16 - View Post Detail).
     * Guest chỉ xem được bài PUBLIC (bài MEMBERS trả 403); bài đã ẩn/không tồn tại trả 404.
     *
     * @param id             ID bài viết cần xem chi tiết
     * @param authentication Thông tin xác thực do Spring Security cung cấp — null/Anonymous nếu là Guest
     * @return Chi tiết bài viết {@link PostResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPostDetail(
            @PathVariable Long id,
            Authentication authentication) {

        boolean authenticated = isAuthenticated(authentication);
        String viewerEmail = authenticated ? authentication.getName() : null;
        PostResponse post = postService.getPostDetail(id, authenticated, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết bài viết thành công", post));
    }

    /**
     * API lấy danh sách bài viết của một người dùng.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        String viewerEmail = isAuthenticated(authentication) ? authentication.getName() : null;
        PageResponse<PostResponse> posts = postService.getUserPosts(userId, category, page, size, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Lấy bài viết của người dùng thành công", posts));
    }

    /**
     * API lấy một trang bình luận (chỉ đọc) của một bài viết (UC16 - View Post Detail).
     * Áp dụng cùng quy tắc quyền xem như xem chi tiết bài viết.
     *
     * @param id             ID bài viết cần lấy bình luận
     * @param page           Số thứ tự trang cần lấy (0-based), mặc định 0
     * @param size           Kích thước trang, mặc định 10
     * @param authentication Thông tin xác thực do Spring Security cung cấp — null/Anonymous nếu là Guest
     * @return Trang bình luận {@link CommentResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getPostComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        PageResponse<CommentResponse> comments = postService.getPostComments(id, page, size, isAuthenticated(authentication));
        return ResponseEntity.ok(ApiResponse.success("Lấy bình luận thành công", comments));
    }

    /**
     * API đăng một bình luận mới trên bài viết (UC18 - Comment on a post).
     * Yêu cầu đăng nhập (JWT); chỉ Sinh viên/Cựu sinh viên được bình luận — vai trò khác nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller.
     * Bài đã ẩn/không tồn tại trả 404; nội dung rỗng/quá dài trả 400.
     *
     * @param id             ID bài viết được bình luận
     * @param request        DTO chứa nội dung bình luận và {@code parentId} nếu là trả lời
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email tác giả
     * @return Bình luận vừa tạo {@link CommentResponse} bọc trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {

        CommentResponse created = postService.createComment(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng bình luận thành công", created));
    }

    /**
     * API chỉnh sửa một bình luận đã đăng (UC19 - Edit a comment).
     * Yêu cầu JWT; chỉ Student/Alumni là tác giả bình luận mới được sửa. Guest nhận 401, người dùng
     * không phải tác giả hoặc Admin nhận 403; bình luận đã xóa, không tồn tại hoặc không thuộc bài viết nhận 404.
     *
     * @param postId         ID bài viết chứa bình luận
     * @param commentId      ID bình luận cần chỉnh sửa
     * @param request        DTO chứa nội dung mới
     * @param authentication Thông tin xác thực dùng để lấy email tác giả
     * @return Bình luận sau khi cập nhật, bọc trong {@link ApiResponse}
     */
    @PutMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication authentication) {

        CommentResponse updated = postService.updateComment(authentication.getName(), postId, commentId, request);
        return ResponseEntity.ok(ApiResponse.success("Chỉnh sửa bình luận thành công", updated));
    }

    /**
     * API xóa một bình luận đã đăng (UC20 - Delete a comment).
     * Yêu cầu JWT; chỉ Student/Alumni là tác giả của bình luận ACTIVE mới được xóa. Guest nhận 401,
     * người dùng không phải tác giả hoặc Admin nhận 403; bình luận không còn khả dụng hoặc sai bài viết nhận 404.
     *
     * @param postId         ID bài viết chứa bình luận
     * @param commentId      ID bình luận cần xóa
     * @param authentication Thông tin xác thực dùng để lấy email tác giả
     * @return Phản hồi thành công không chứa dữ liệu nghiệp vụ
     */
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication) {

        postService.deleteComment(authentication.getName(), postId, commentId);
        return ResponseEntity.ok(ApiResponse.success("Xóa bình luận thành công", null));
    }

    /**
     * API thích một bài viết (UC17 - Like a post). Yêu cầu đăng nhập; chỉ STUDENT/ALUMNI được thích
     * (Admin/vai trò khác nhận 403). Bài đã ẩn/không tồn tại trả 404. Thao tác lũy đẳng.
     *
     * @param id             ID bài viết cần thích
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người dùng
     * @return Trạng thái like mới + số lượt thích {@link LikeResponse} bọc trong {@link ApiResponse}
     */
    /**
     * API báo cáo bài viết vi phạm (UC24). Báo cáo luôn được lưu ở trạng thái PENDING
     * và không tự động thay đổi trạng thái của bài viết.
     */
    @PostMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<ReportResponse>> reportPost(
            @PathVariable Long id,
            @Valid @RequestBody CreatePostReportRequest request,
            Authentication authentication) {

        ReportResponse report = reportService.reportPost(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã gửi báo cáo. Chúng tôi sẽ xem xét bài viết này", report));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> likePost(
            @PathVariable Long id,
            Authentication authentication) {

        LikeResponse result = postService.likePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã thích bài viết", result));
    }

    /**
     * API bỏ thích một bài viết (UC17 - Like a post). Yêu cầu đăng nhập; chỉ STUDENT/ALUMNI.
     * Bài đã ẩn/không tồn tại trả 404. Thao tác lũy đẳng.
     *
     * @param id             ID bài viết cần bỏ thích
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người dùng
     * @return Trạng thái like mới + số lượt thích {@link LikeResponse} bọc trong {@link ApiResponse}
     */
    @DeleteMapping("/{id}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> unlikePost(
            @PathVariable Long id,
            Authentication authentication) {

        LikeResponse result = postService.unlikePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ thích bài viết", result));
    }

    /**
     * API lấy danh sách bài viết đã lưu của người dùng hiện tại (UC20 - View Saved Posts).
     * Yêu cầu đăng nhập; chỉ STUDENT/ALUMNI được truy cập — Admin/Guest nhận 403.
     *
     * @param page           Số thứ tự trang cần lấy (0-based), mặc định 0
     * @param size           Kích thước trang, mặc định 10
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người dùng
     * @return Trang kết quả bài viết đã lưu {@link PostResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            throw new com.alumnect.alumnect_backend.exception.ForbiddenException("Vui lòng đăng nhập để xem danh sách bài viết đã lưu");
        }
        PageResponse<PostResponse> savedPosts = postService.getSavedPosts(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bài viết đã lưu thành công", savedPosts));
    }

    /**
     * API lưu/đánh dấu (bookmark) một bài viết (UC20 - Save Post).
     * Yêu cầu đăng nhập; chỉ STUDENT/ALUMNI được lưu bài viết (Admin/vai trò khác nhận 403).
     * Bài đã ẩn/xóa/không tồn tại trả 404. Thao tác có tính lũy đẳng.
     *
     * @param id             ID bài viết cần lưu
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người dùng
     * @return Trạng thái lưu mới {@link SavePostResponse} bọc trong {@link ApiResponse}
     */
    @PostMapping("/{id}/save")
    public ResponseEntity<ApiResponse<SavePostResponse>> savePost(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            throw new com.alumnect.alumnect_backend.exception.ForbiddenException("Vui lòng đăng nhập để lưu bài viết");
        }
        SavePostResponse result = postService.savePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu bài viết thành công", result));
    }

    /**
     * API bỏ lưu/bỏ đánh dấu một bài viết (UC20 - Save Post).
     * Yêu cầu đăng nhập; chỉ STUDENT/ALUMNI được bỏ lưu bài viết.
     * Bài đã ẩn/xóa/không tồn tại trả 404. Thao tác có tính lũy đẳng.
     *
     * @param id             ID bài viết cần bỏ lưu
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người dùng
     * @return Trạng thái lưu mới {@link SavePostResponse} bọc trong {@link ApiResponse}
     */
    @DeleteMapping("/{id}/save")
    public ResponseEntity<ApiResponse<SavePostResponse>> unsavePost(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            throw new com.alumnect.alumnect_backend.exception.ForbiddenException("Vui lòng đăng nhập để bỏ lưu bài viết");
        }
        SavePostResponse result = postService.unsavePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ lưu bài viết thành công", result));
    }

    /**
     * API xóa một bài viết đã đăng (UC23 - Delete a post).
     * Yêu cầu đăng nhập (JWT); chỉ tác giả (Sinh viên/Cựu sinh viên) mới được xóa bài
     * của chính mình — người khác hoặc Admin nhận 403.
     * Bài đã xóa/không tồn tại trả 404.
     *
     * @param id             ID bài viết cần xóa
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email tác giả
     * @return {@link ApiResponse} rỗng với trạng thái thành công, HTTP 200 OK
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long id,
            Authentication authentication) {

        postService.deletePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bài viết thành công", null));
    }

    /**
     * Xác định người gọi đã đăng nhập hay là Guest dựa trên {@link Authentication} do Spring Security cung cấp.
     *
     * @param authentication Đối tượng xác thực — null hoặc {@link AnonymousAuthenticationToken} nếu là Guest
     * @return true nếu đã đăng nhập (có JWT hợp lệ), false nếu là Guest
     */
    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
