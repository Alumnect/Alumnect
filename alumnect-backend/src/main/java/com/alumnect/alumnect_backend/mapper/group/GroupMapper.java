package com.alumnect.alumnect_backend.mapper.group;

import com.alumnect.alumnect_backend.dto.response.group.GroupCardResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupDetailResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMemberResponse;
import com.alumnect.alumnect_backend.dto.response.group.JoinRequestResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.stereotype.Component;

/**
 * Chuyển đổi Entity hội nhóm/thành viên sang các DTO trả về Client. Ghép dữ liệu từ nhiều nguồn
 * (CommunityGroup + GroupMember của người xem + UserProfile) nên viết tay thay vì MapStruct.
 */
@Component
public class GroupMapper {

    /** Độ dài tối đa của mô tả rút gọn trên thẻ hội nhóm. */
    private static final int SHORT_DESCRIPTION_MAX = 180;

    /** Giá trị viewerMembershipStatus khi người xem chưa có tư cách thành viên nào (hoặc là Guest). */
    public static final String NO_MEMBERSHIP = "NONE";

    public GroupCardResponse toCard(CommunityGroup group, GroupMember viewer) {
        return GroupCardResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .shortDescription(shorten(group.getDescription()))
                .coverImageUrl(group.getCoverImageUrl())
                .category(group.getCategory())
                .topics(group.getTopics())
                .privacy(group.getPrivacy().name())
                .memberCount(group.getMemberCount())
                .status(group.getStatus().name())
                .viewerMembershipStatus(viewerStatus(viewer))
                .viewerRole(viewerRole(viewer))
                .build();
    }

    /**
     * @param ownerProfile hồ sơ chủ sở hữu, hoặc null nếu cần ẩn thông tin sáng lập (nhóm riêng tư, người xem ngoài nhóm)
     * @param showOwner    true nếu được phép hiển thị thông tin người sáng lập
     */
    public GroupDetailResponse toDetail(CommunityGroup group, GroupMember viewer, UserProfile ownerProfile,
                                        boolean showOwner, boolean canViewMembers, Long pendingRequestCount,
                                        Long conversationId, boolean isConversationMember) {
        GroupDetailResponse.GroupOwnerInfo ownerInfo = null;
        if (showOwner) {
            User owner = group.getOwner();
            ownerInfo = GroupDetailResponse.GroupOwnerInfo.builder()
                    .userId(owner.getId())
                    .fullName(displayName(ownerProfile, owner))
                    .avatarUrl(ownerProfile != null && ownerProfile.getAvatarUrl() != null ? ownerProfile.getAvatarUrl() : "")
                    .build();
        }
        return GroupDetailResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .coverImageUrl(group.getCoverImageUrl())
                .category(group.getCategory())
                .topics(group.getTopics())
                .privacy(group.getPrivacy().name())
                .joinRules(group.getJoinRules())
                .memberCount(group.getMemberCount())
                .status(group.getStatus().name())
                .createdAt(group.getCreatedAt())
                .owner(ownerInfo)
                .viewerMembershipStatus(viewerStatus(viewer))
                .viewerRole(viewerRole(viewer))
                .canViewMembers(canViewMembers)
                .pendingRequestCount(pendingRequestCount)
                .conversationId(conversationId)
                .isConversationMember(isConversationMember)
                .build();
    }

    public GroupMemberResponse toMember(GroupMember member, UserProfile profile) {
        User user = member.getUser();
        return GroupMemberResponse.builder()
                .userId(user.getId())
                .fullName(displayName(profile, user))
                .avatarUrl(profile != null && profile.getAvatarUrl() != null ? profile.getAvatarUrl() : "")
                .headline(profile != null && profile.getHeadline() != null ? profile.getHeadline() : "")
                .role(member.getRole().name())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    public JoinRequestResponse toJoinRequest(GroupMember member, UserProfile profile) {
        User user = member.getUser();
        return JoinRequestResponse.builder()
                .requestId(member.getId())
                .userId(user.getId())
                .fullName(displayName(profile, user))
                .avatarUrl(profile != null && profile.getAvatarUrl() != null ? profile.getAvatarUrl() : "")
                .headline(profile != null && profile.getHeadline() != null ? profile.getHeadline() : "")
                .status(member.getMembershipStatus().name())
                .requestedAt(member.getUpdatedAt())
                .build();
    }

    public String viewerStatus(GroupMember viewer) {
        return viewer == null ? NO_MEMBERSHIP : viewer.getMembershipStatus().name();
    }

    /** Vai trò trong nhóm chỉ có ý nghĩa khi người xem đang là thành viên ACTIVE. */
    public String viewerRole(GroupMember viewer) {
        return viewer != null && viewer.getMembershipStatus() == com.alumnect.alumnect_backend.common.enums.MembershipStatus.ACTIVE
                ? viewer.getRole().name()
                : null;
    }

    private String displayName(UserProfile profile, User user) {
        return profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()
                ? profile.getFullName()
                : user.getEmail();
    }

    private String shorten(String text) {
        if (text == null) {
            return "";
        }
        String flat = text.strip().replaceAll("\\s+", " ");
        return flat.length() <= SHORT_DESCRIPTION_MAX ? flat : flat.substring(0, SHORT_DESCRIPTION_MAX).stripTrailing() + "…";
    }
}
