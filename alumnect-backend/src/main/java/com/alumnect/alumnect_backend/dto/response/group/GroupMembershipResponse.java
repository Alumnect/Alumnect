package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Kết quả sau khi người dùng tham gia / gửi yêu cầu / hủy yêu cầu / rời hội nhóm. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMembershipResponse {
    private Long groupId;
    private String viewerMembershipStatus;
    private String viewerRole;
    private int memberCount;
    private String message;
}
