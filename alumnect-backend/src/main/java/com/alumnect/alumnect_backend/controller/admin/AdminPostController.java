package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.admin.AdminPostUpdateStatusDto;
import com.alumnect.alumnect_backend.dto.response.admin.AdminPostResponse;
import com.alumnect.alumnect_backend.service.admin.AdminPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu quản lý và kiểm duyệt bài viết dành cho Quản trị viên (Admin).
 */
@RestController
@RequestMapping("/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final AdminPostService adminPostService;

    /**
     * Lấy danh sách toàn bộ bài viết phân trang và hỗ trợ lọc động (UC65 & UC66).
     *
     * @param query Từ khóa tìm kiếm nội dung bài viết (tùy chọn)
     * @param author Từ khóa tìm kiếm theo tên hoặc email tác giả (tùy chọn)
     * @param status Trạng thái ẩn bài viết: VISIBLE, HIDDEN, hoặc ALL (tùy chọn)
     * @param type   Loại bài viết: NORMAL, EVENT, RECRUITMENT, ACHIEVEMENT hoặc ALL (tùy chọn)
     * @param page Số trang hiển thị, mặc định 0
     * @param size Số lượng phần tử mỗi trang, mặc định 10
     * @return Trang danh sách bài viết bọc trong ApiResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminPostResponse>>> getPosts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<AdminPostResponse> posts = adminPostService.getPosts(query, author, status, type, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bài viết thành công", posts));
    }

    /**
     * Ẩn hoặc hiển thị lại bài viết vi phạm trên bảng tin cộng đồng (UC68).
     *
     * @param id ID bài viết cần cập nhật
     * @param request DTO chứa trạng thái ẩn mong muốn
     * @return Kết quả thành công bọc trong ApiResponse
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> togglePostHidden(
            @PathVariable Long id,
            @Valid @RequestBody AdminPostUpdateStatusDto request) {

        adminPostService.togglePostHidden(id, request.getHidden());
        String msg = request.getHidden() ? "Ẩn bài viết thành công" : "Mở ẩn bài viết thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
     }

    /**
     * Lấy thông tin chi tiết bài viết cộng đồng dành cho Admin (UC67).
     * Mô tả chi tiết: Tiếp nhận yêu cầu lấy chi tiết bài viết từ Client, thực hiện gọi Service và trả về định dạng ApiResponse.
     *
     * @param id ID bài viết cần lấy chi tiết
     * @return Đối tượng phản hồi chứa chi tiết bài viết bọc trong ApiResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPostResponse>> getPostDetail(@PathVariable Long id) {
        // Gọi dịch vụ lấy chi tiết bài viết
        AdminPostResponse post = adminPostService.getPostDetail(id);
        
        // Trả về kết quả thành công bọc trong ApiResponse
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết bài viết thành công", post));
    }
}
