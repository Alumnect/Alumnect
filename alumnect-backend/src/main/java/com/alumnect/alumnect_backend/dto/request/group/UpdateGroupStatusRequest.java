package com.alumnect.alumnect_backend.dto.request.group;

import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Trạng thái mới khi Owner đóng (INACTIVE) hoặc mở lại (ACTIVE) hội nhóm. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private GroupStatus status;
}
