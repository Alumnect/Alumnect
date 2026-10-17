package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu cập nhật thông tin nhóm Mentoring (tên, mô tả, đóng nhóm).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMentoringGroupRequest {

    @Size(min = 2, max = 200, message = "Tên nhóm phải từ 2 đến 200 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả nhóm không được vượt quá 2000 ký tự")
    private String description;

    private MentoringGroupStatus status;
}
