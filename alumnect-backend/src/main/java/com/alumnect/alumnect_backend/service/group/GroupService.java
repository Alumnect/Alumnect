package com.alumnect.alumnect_backend.service.group;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.enums.JoinRequestAction;
import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupActionResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupCardResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupDetailResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMemberResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMembershipResponse;
import com.alumnect.alumnect_backend.dto.response.group.JoinRequestResponse;

/**
 * Nghiệp vụ Hội nhóm cộng đồng. Tham số {@code email} là email người dùng đang đăng nhập; các API công khai
 * nhận {@code null} khi người xem là Guest. Mọi kiểm tra quyền đều thực hiện tại đây (BR-11).
 */
public interface GroupService {

    /** Danh sách khám phá hội nhóm đang hoạt động, có tìm kiếm/lọc/phân trang. */
    PageResponse<GroupCardResponse> listGroups(String email, String keyword, String category, int page, int size);

    /** Các hội nhóm người dùng đang là thành viên ACTIVE. */
    PageResponse<GroupCardResponse> getMyGroups(String email, int page, int size);

    GroupDetailResponse getGroupDetail(Long groupId, String email);

    GroupDetailResponse createGroup(String email, CreateGroupRequest request);

    GroupDetailResponse updateGroup(Long groupId, String email, UpdateGroupRequest request);

    /** Owner đóng (INACTIVE) hoặc mở lại (ACTIVE) hội nhóm. */
    GroupActionResponse updateGroupStatus(Long groupId, String email, GroupStatus status);

    /** Owner xóa mềm hội nhóm (DELETED). */
    GroupActionResponse deleteGroup(Long groupId, String email);

    /** Tham gia nhóm công khai (ACTIVE) hoặc gửi yêu cầu tham gia nhóm riêng tư (PENDING). */
    GroupMembershipResponse joinGroup(Long groupId, String email);

    /** Hủy yêu cầu đang chờ duyệt hoặc rời nhóm; Owner còn thành viên khác phải truyền {@code transferToUserId}. */
    GroupMembershipResponse leaveGroup(Long groupId, String email, Long transferToUserId);

    PageResponse<GroupMemberResponse> getMembers(Long groupId, String email, String keyword, int page, int size);

    PageResponse<JoinRequestResponse> getJoinRequests(Long groupId, String email, int page, int size);

    GroupActionResponse handleJoinRequest(Long groupId, Long requestId, String email, JoinRequestAction action);

    GroupActionResponse removeMember(Long groupId, Long targetUserId, String email);

    GroupActionResponse changeMemberRole(Long groupId, Long targetUserId, String email, MembershipRole newRole);
}
