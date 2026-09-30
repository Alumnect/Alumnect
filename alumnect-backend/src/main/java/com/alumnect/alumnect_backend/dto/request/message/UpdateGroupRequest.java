package com.alumnect.alumnect_backend.dto.request.message;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu cập nhật thông tin nhóm trò chuyện (tên nhóm, ảnh nhóm).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupRequest {

    /** Tên nhóm mới */
    @Size(min = 2, max = 100, message = "Tên nhóm phải từ 2 đến 100 ký tự")
    private String title;

    /** Ảnh đại diện nhóm mới */
    private String avatarUrl;
}
