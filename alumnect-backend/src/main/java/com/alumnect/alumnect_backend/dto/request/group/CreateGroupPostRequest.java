package com.alumnect.alumnect_backend.dto.request.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Yêu cầu đăng bài viết / thảo luận mới trong hội nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupPostRequest {

    @NotBlank(message = "Nội dung thảo luận không được để trống")
    @Size(max = 5000, message = "Nội dung thảo luận không được vượt quá 5000 ký tự")
    private String content;

    @Size(max = 50, message = "Chủ đề không được vượt quá 50 ký tự")
    private String topic;

    @Size(max = 10, message = "Mỗi bài viết chỉ được đính kèm tối đa 10 hình ảnh")
    private List<String> imageUrls;

    @Size(max = 10, message = "Mỗi bài viết chỉ được đính kèm tối đa 10 video")
    private List<String> videoUrls;
}
