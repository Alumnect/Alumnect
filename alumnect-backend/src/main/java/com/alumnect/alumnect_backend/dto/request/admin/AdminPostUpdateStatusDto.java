package com.alumnect.alumnect_backend.dto.request.admin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin cập nhật trạng thái ẩn/mở bài viết của Admin.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPostUpdateStatusDto {

    @NotNull(message = "Trạng thái ẩn không được để trống")
    private Boolean hidden;
}
