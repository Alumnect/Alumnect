package com.alumnect.alumnect_backend.dto.request.group;

import com.alumnect.alumnect_backend.common.enums.JoinRequestAction;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thao tác duyệt (APPROVE) hoặc từ chối (REJECT) một yêu cầu tham gia hội nhóm. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandleJoinRequestRequest {

    @NotNull(message = "Thao tác xử lý yêu cầu không được để trống")
    private JoinRequestAction action;
}
