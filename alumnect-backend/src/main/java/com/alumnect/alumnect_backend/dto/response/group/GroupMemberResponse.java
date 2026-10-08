package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Một thành viên ACTIVE trong danh sách thành viên hội nhóm. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private String headline;
    /** Vai trò trong nhóm: OWNER | ADMIN | MEMBER */
    private String role;
    private Instant joinedAt;
}
