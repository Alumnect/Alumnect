package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO phản hồi chi tiết nhóm Mentoring theo mô hình Group-First.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringGroupResponse {
    private Long id;
    private String name;
    private String description;
    private MentoringGroupStatus status;
    private Long leaderId;
    private String leaderName;
    private String leaderAvatarUrl;
    private Instant createdAt;
    private Instant updatedAt;
    private int maxMembers;
    private int joinedMemberCount;
    private int pendingMemberCount;
    private boolean canManage;

    /** ID của Mentoring Request liên kết gần nhất (đảm bảo tương thích ngược) */
    private Long requestId;

    @Builder.Default
    private List<MentoringGroupMemberResponse> members = new ArrayList<>();

    @Builder.Default
    private List<MentoringGroupRequestSummaryResponse> requests = new ArrayList<>();
}
