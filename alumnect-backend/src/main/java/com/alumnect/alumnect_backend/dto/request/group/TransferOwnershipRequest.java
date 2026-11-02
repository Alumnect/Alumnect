package com.alumnect.alumnect_backend.dto.request.group;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Người sẽ nhận quyền sở hữu khi Owner rời nhóm (bắt buộc nếu nhóm còn thành viên khác). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferOwnershipRequest {

    @NotNull(message = "Vui lòng chọn thành viên nhận quyền sở hữu")
    private Long newOwnerId;
}
