package com.alumnect.alumnect_backend.dto.request.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu yêu cầu trả lời một câu hỏi trên diễn đàn Q&A (UC41 - Answer a question).
 * <p>
 * {@code parentId} tùy chọn: null = câu trả lời gốc cho câu hỏi; có giá trị = reply cho một câu
 * trả lời gốc (chỉ hỗ trợ 2 cấp — reply cho reply sẽ bị từ chối ở tầng Service).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnswerRequest {

    /** Nội dung câu trả lời (bắt buộc, tối đa 10000 ký tự) */
    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    @Size(max = 10000, message = "Nội dung câu trả lời không được vượt quá 10000 ký tự")
    private String body;

    /** ID câu trả lời cha (tùy chọn) — null nếu là câu trả lời gốc; có giá trị nếu là reply */
    private Long parentId;
}
