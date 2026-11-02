package com.alumnect.alumnect_backend.dto.response.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Chi tiết hội nhóm. Với nhóm PRIVATE mà người xem không phải thành viên ACTIVE, {@code owner} là null và
 * {@code canViewMembers} là false (BR-13).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDetailResponse {
    private Long id;
    private String name;
    private String description;
    private String coverImageUrl;
    private String category;
    private List<String> topics;
    private String privacy;
    private String joinRules;
    private int memberCount;
    private String status;
    private Instant createdAt;
    private GroupOwnerInfo owner;
    private String viewerMembershipStatus;
    private String viewerRole;
    private boolean canViewMembers;
    /** Số yêu cầu tham gia đang chờ duyệt — chỉ có giá trị với Owner/Admin */
    private Long pendingRequestCount;
    /** Mã cuộc trò chuyện nhóm (nếu hội nhóm đã khởi tạo nhóm chat) */
    private Long conversationId;
    /** Người xem hiện tại đã tham gia nhóm chat này chưa */
    @JsonProperty("isConversationMember")
    private boolean isConversationMember;

    /** Thông tin người sáng lập/sở hữu hội nhóm */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupOwnerInfo {
        private Long userId;
        private String fullName;
        private String avatarUrl;
    }
}
