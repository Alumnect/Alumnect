package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO chứa dữ liệu yêu cầu chỉnh sửa một bài viết trên bảng tin cộng đồng
 * (UC22 - Edit a post).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EditPostRequest {

    /** Nội dung văn bản của bài viết sau khi chỉnh sửa (bắt buộc, tối đa 5000 ký tự) */
    @NotBlank(message = "Nội dung bài viết không được để trống")
    @Size(max = 5000, message = "Nội dung bài viết không được vượt quá 5000 ký tự")
    private String content;

    /**
     * Loại bài viết: "general" | "achievement" | "recruitment" | "event".
     * Bỏ trống sẽ giữ nguyên loại hiện tại.
     */
    private String category;

    private String type;

    private String imageUrl;
    
    private JobDto job;
    
    private EventDto event;

    /** Danh sách URL ảnh đính kèm (tùy chọn). Gửi rỗng để xóa hết ảnh cũ */
    private List<String> mediaUrls;

    /** ID của sự kiện liên kết (nếu category là EVENT) */
    private Long eventId;

    /** ID của tin tuyển dụng liên kết (nếu category là RECRUITMENT) */
    private Long jobId;
}
