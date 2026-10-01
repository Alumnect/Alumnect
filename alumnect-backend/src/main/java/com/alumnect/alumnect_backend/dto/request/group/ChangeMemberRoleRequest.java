package com.alumnect.alumnect_backend.dto.request.group;

import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Vai trò mới của thành viên: chỉ ADMIN (phân quyền) hoặc MEMBER (thu hồi quyền) được chấp nhận. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeMemberRoleRequest {

    @NotNull(message = "Vai trò không được để trống")
    private MembershipRole role;
}
