package com.alumnect.alumnect_backend.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO phục vụ việc thay đổi trạng thái hoạt động tài khoản (khóa/mở khóa) của Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserStatusDto {

    /** Trạng thái tài khoản mới, chỉ được nhận giá trị ACTIVE hoặc LOCKED */
    @NotBlank(message = "Trạng thái tài khoản không được để trống")
    @Pattern(regexp = "ACTIVE|LOCKED", message = "Trạng thái tài khoản chỉ có thể là ACTIVE hoặc LOCKED")
    private String status;
}
