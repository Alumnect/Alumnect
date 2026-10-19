package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO phản hồi thông tin thành viên / lời mời trong nhóm Mentoring.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringGroupMemberResponse {
    /** ID bản ghi lời mời/membership (mentoring_group_members.id) */
    private Long id;
    private Long groupId;
    private Long userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String major;
    private String role;
    private boolean leader;
    private MentoringGroupMemberStatus status;
    private Instant invitedAt;
    private Instant joinedAt;
    private Instant removedAt;
}
