package com.alumnect.alumnect_backend.dto.request.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateGroupCommentRequest {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 1000, message = "Nội dung bình luận không được vượt quá 1000 ký tự")
    private String content;
}
