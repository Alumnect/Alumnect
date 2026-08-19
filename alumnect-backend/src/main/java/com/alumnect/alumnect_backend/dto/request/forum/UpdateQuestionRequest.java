package com.alumnect.alumnect_backend.dto.request.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa dữ liệu yêu cầu chỉnh sửa một câu hỏi trên diễn đàn Q&A (UC46 - Edit a question).
 * <p>
 * Cùng bộ trường với {@link CreateQuestionRequest}: người dùng có thể sửa tiêu đề, nội dung,
 * thể loại, ngành và thay bộ ảnh đính kèm. Quyền sở hữu (chỉ tác giả) được kiểm tra ở tầng Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuestionRequest {

    /** Tiêu đề câu hỏi (bắt buộc, tối đa 250 ký tự) */
    @NotBlank(message = "Tiêu đề câu hỏi không được để trống")
    @Size(max = 250, message = "Tiêu đề câu hỏi không được vượt quá 250 ký tự")
    private String title;

    /** Nội dung chi tiết câu hỏi (bắt buộc, tối đa 10000 ký tự) */
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 10000, message = "Nội dung câu hỏi không được vượt quá 10000 ký tự")
    private String body;

    /** ID thể loại của câu hỏi (tùy chọn) — null nếu bỏ phân loại */
    private Long topicId;

    /** ID ngành của câu hỏi (tùy chọn) — null nếu bỏ chọn ngành */
    private Long majorId;

    /** Bộ ảnh đính kèm mới, thay toàn bộ ảnh cũ (tùy chọn, tối đa {@value CreateQuestionRequest#MAX_IMAGES} ảnh) */
    @Size(max = CreateQuestionRequest.MAX_IMAGES, message = "Chỉ được đính kèm tối đa 5 ảnh")
    private List<String> imageUrls;
}
