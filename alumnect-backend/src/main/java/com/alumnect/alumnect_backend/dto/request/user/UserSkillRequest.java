package com.alumnect.alumnect_backend.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu nhận dữ liệu kỹ năng của người dùng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillRequest {

    /** Tên nhóm kỹ năng (VD: Lập trình, Ngoại ngữ, Soft Skills) */
    @NotBlank(message = "Tên nhóm kỹ năng không được để trống")
    @Size(max = 80, message = "Tên nhóm kỹ năng không được vượt quá 80 ký tự")
    private String groupName;

    /** Tên kỹ năng cụ thể (VD: Java, React, Communication) */
    @NotBlank(message = "Tên kỹ năng không được để trống")
    @Size(max = 80, message = "Tên kỹ năng không được vượt quá 80 ký tự")
    private String skillName;

    /** Thứ tự sắp xếp hiển thị */
    private short sortOrder;
}
