package com.alumnect.alumnect_backend.dto.request.message;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO yêu cầu thêm thành viên vào nhóm trò chuyện.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMembersRequest {

    /** Danh sách mã ID người dùng cần thêm vào nhóm */
    @NotEmpty(message = "Danh sách thành viên cần thêm không được rỗng")
    private List<Long> memberIds;
}
