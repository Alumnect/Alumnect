package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Kết quả chung của các thao tác quản trị: đóng/xóa nhóm, duyệt yêu cầu, xóa thành viên, đổi vai trò. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupActionResponse {
    private Long groupId;
    /** Người bị tác động (nếu có) */
    private Long targetUserId;
    /** Trạng thái/vai trò mới sau thao tác */
    private String status;
    private Integer memberCount;
    private String message;
}
