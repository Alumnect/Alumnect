package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO chứa dữ liệu yêu cầu tạo một bài viết mới trên bảng tin cộng đồng
 * (UC14 - Create a post on the Feed).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {

    /** Nội dung văn bản của bài viết (bắt buộc, tối đa 5000 ký tự) */
    @NotBlank(message = "Post category cannot be blank")
    private String type;

    private String imageUrl;
    
    private JobDto job;
    
    private EventDto event;

    @NotBlank(message = "Nội dung bài viết không được để trống")
    @Size(max = 5000, message = "Nội dung bài viết không được vượt quá 5000 ký tự")
    private String content;

    /**
     * Loại bài viết: "general" | "achievement" | "recruitment" | "event".
     * Bỏ trống sẽ mặc định là GENERAL. Giá trị không hợp lệ trả về lỗi 400.
     */
    private String category;

    /** Danh sách URL ảnh đính kèm (tùy chọn) */
    private List<String> mediaUrls;

    /** ID của sự kiện liên kết (nếu category là EVENT) */
    private Long eventId;

    /** ID của tin tuyển dụng liên kết (nếu category là RECRUITMENT) */
    private Long jobId;
}
