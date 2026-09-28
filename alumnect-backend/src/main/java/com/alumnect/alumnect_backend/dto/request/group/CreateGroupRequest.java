package com.alumnect.alumnect_backend.dto.request.group;

import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Dữ liệu yêu cầu tạo hội nhóm mới. Không có trường vai trò/trạng thái thành viên: người tạo luôn được Service
 * gán OWNER + ACTIVE (BR-09).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {

    public static final int MAX_TOPICS = 5;

    @NotBlank(message = "Tên hội nhóm không được để trống")
    @Size(max = 200, message = "Tên hội nhóm không được vượt quá 200 ký tự")
    private String name;

    @NotBlank(message = "Mô tả hội nhóm không được để trống")
    @Size(max = 5000, message = "Mô tả hội nhóm không được vượt quá 5000 ký tự")
    private String description;

    @Size(max = 500, message = "Đường dẫn ảnh bìa không được vượt quá 500 ký tự")
    private String coverImageUrl;

    @NotBlank(message = "Danh mục hoạt động không được để trống")
    private String category;

    @Size(max = MAX_TOPICS, message = "Chỉ được nhập tối đa 5 chủ đề")
    private List<String> topics;

    @NotNull(message = "Loại hội nhóm không được để trống")
    private GroupPrivacy privacy;

    @Size(max = 2000, message = "Quy định tham gia không được vượt quá 2000 ký tự")
    private String joinRules;
}
