package com.alumnect.alumnect_backend.dto.request.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO yêu cầu khởi tạo nhóm trò chuyện mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {

    /** Tên nhóm trò chuyện */
    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(min = 1, max = 100, message = "Tên nhóm phải từ 1 đến 100 ký tự")
    private String title;

    /** Đường dẫn ảnh đại diện nhóm (tùy chọn) */
    private String avatarUrl;

    /** Danh sách mã ID người dùng được mời vào nhóm */
    @NotEmpty(message = "Nhóm phải có ít nhất 1 thành viên khác")
    private List<Long> memberIds;
}
