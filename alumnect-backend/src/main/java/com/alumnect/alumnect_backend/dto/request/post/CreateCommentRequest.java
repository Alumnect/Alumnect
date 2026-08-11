package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu yêu cầu đăng một bình luận mới trên bài viết
 * (UC18 - Comment on a post).
 * <p>
 * {@code parentId} là tùy chọn: bỏ trống nghĩa là bình luận gốc, có giá trị nghĩa là
 * trả lời một bình luận khác. Bảng {@code comments} chỉ hỗ trợ 1 cấp trả lời nên tầng
 * Service sẽ quy chiếu trả lời-của-trả lời về đúng bình luận gốc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {

    /** Nội dung văn bản của bình luận (bắt buộc, tối đa 2000 ký tự) */
    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 2000, message = "Nội dung bình luận không được vượt quá 2000 ký tự")
    private String content;

    /**
     * ID bình luận cha nếu đây là một trả lời (1 cấp); bỏ trống nếu là bình luận gốc.
     * Bình luận cha phải thuộc cùng bài viết và đang ACTIVE, ngược lại trả về 404 ở tầng Service.
     */
    private Long parentId;
}
