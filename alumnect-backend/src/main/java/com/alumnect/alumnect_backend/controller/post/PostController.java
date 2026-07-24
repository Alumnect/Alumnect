package com.alumnect.alumnect_backend.controller.post;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.service.post.PostService;
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
     * API thích một bài viết (UC17 - Like a post). Yêu cầu đăng nhập; chỉ STUDENT/ALUMNI được thích
     * (Admin/vai trò khác nhận 403). Bài đã ẩn/không tồn tại trả 404. Thao tác lũy đẳng.
     *
     * @param id             ID bài viết cần thích
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người dùng
     * @return Trạng thái like mới + số lượt thích {@link LikeResponse} bọc trong {@link ApiResponse}
     */
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
