package com.alumnect.alumnect_backend.dto.request.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa dữ liệu yêu cầu đặt một câu hỏi mới trên diễn đàn Q&A (UC40 - Ask a question).
 * <p>
 * {@code topicId} (thể loại) và {@code majorId} (ngành) đều tùy chọn (null nếu chưa chọn);
 * nếu có sẽ được kiểm tra tồn tại ở tầng Service (không tồn tại trả về lỗi 400).
 * {@code imageUrls} là danh sách URL ảnh đã upload sẵn (tối đa 5), tùy chọn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {

    /** Số ảnh tối đa cho phép đính kèm một câu hỏi */
    public static final int MAX_IMAGES = 5;

    /** Tiêu đề câu hỏi (bắt buộc, tối đa 250 ký tự) */
    @NotBlank(message = "Tiêu đề câu hỏi không được để trống")
    @Size(max = 250, message = "Tiêu đề câu hỏi không được vượt quá 250 ký tự")
    private String title;

    /** Nội dung chi tiết câu hỏi (bắt buộc, tối đa 10000 ký tự) */
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 10000, message = "Nội dung câu hỏi không được vượt quá 10000 ký tự")
    private String body;

    /** ID thể loại của câu hỏi (tùy chọn) — null nếu chưa phân loại */
    private Long topicId;

    /** ID ngành của câu hỏi (tùy chọn) — null nếu chưa chọn ngành */
    private Long majorId;

    /** Danh sách URL ảnh đính kèm (tùy chọn, tối đa {@value #MAX_IMAGES} ảnh) */
    @Size(max = MAX_IMAGES, message = "Chỉ được đính kèm tối đa 5 ảnh")
    private List<String> imageUrls;
}
