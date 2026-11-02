package com.alumnect.alumnect_backend.dto.request.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Yêu cầu gửi bình luận trong bài viết hội nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupCommentRequest {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 1000, message = "Nội dung bình luận không được vượt quá 1000 ký tự")
    private String content;

    /** Bình luận cha; trả lời reply sẽ được gắn vào bình luận gốc. */
    private Long parentId;
}
