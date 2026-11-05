package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu tính năng AI Studio [B1]: người dùng chỉ gõ một câu ý tưởng ngắn, hệ thống trả về bài viết hoàn
 * chỉnh + dữ liệu tự điền form (Job/Event) + cấu hình thiết kế Poster.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostAiStudioRequest {

    /** Câu ý tưởng/nháp của người dùng (bắt buộc, tối đa 1500 ký tự). */
    @NotBlank(message = "Vui lòng nhập ý tưởng ngắn cho bài viết")
    @Size(max = 1500, message = "Ý tưởng không được vượt quá 1500 ký tự")
    private String prompt;

    /**
     * Gợi ý loại bài viết đang chọn trên giao diện ("normal"/"achievement"/"recruitment"/"event") — tùy chọn.
     * Chỉ dùng khi nội dung ý tưởng không đủ tín hiệu để tự nhận diện loại bài.
     */
    private String preferredType;
}
