package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa nội dung mới khi tác giả chỉnh sửa bình luận của mình (UC19).
 * Quyền sở hữu bình luận được kiểm tra tại Service Layer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCommentRequest {

    /** Nội dung bình luận sau khi chỉnh sửa, bắt buộc và tối đa 2000 ký tự. */
    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 2000, message = "Nội dung bình luận không được vượt quá 2000 ký tự")
    private String content;
}
