package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class InviteMentoringGroupMembersRequest {
    @NotEmpty(message = "Vui lòng chọn ít nhất một thành viên")
    @Size(max = 9, message = "Số thành viên mời vượt quá giới hạn")
    private List<Long> userIds;
}
