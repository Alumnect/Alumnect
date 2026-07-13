package com.alumnect.alumnect_backend.controller.post;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.service.post.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các yêu cầu liên quan đến bảng tin cộng đồng (UC15 - View community Feed).
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

        boolean isAuthenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        PageResponse<PostResponse> feed = postService.getFeed(page, size, type, isAuthenticated);
        return ResponseEntity.ok(ApiResponse.success("Lấy bảng tin thành công", feed));
    }
}
