package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu tạo mới nhóm Mentoring (mô hình GROUP-FIRST).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMentoringGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(min = 2, max = 200, message = "Tên nhóm phải từ 2 đến 200 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả nhóm không được vượt quá 2000 ký tự")
    private String description;
}
