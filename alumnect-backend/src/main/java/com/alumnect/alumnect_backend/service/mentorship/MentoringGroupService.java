package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupRequestSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroup;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;

import java.util.List;

/**
 * Service quản lý nhóm Mentoring theo mô hình Group-First (UC122).
 */
public interface MentoringGroupService {

    /** Tạo nhóm Mentoring độc lập (Leader tự động JOINED) */
    MentoringGroupResponse createGroup(String email, CreateMentoringGroupRequest request);

    /** Cập nhật thông tin hoặc trạng thái nhóm (Leader only) */
    MentoringGroupResponse updateGroup(String email, Long groupId, UpdateMentoringGroupRequest request);

    /** Tạo nhóm tương thích ngược cho yêu cầu cũ nếu có */
    MentoringGroup createForRequest(User leader, String title, List<Long> memberIds);

    /** Xem chi tiết thông tin nhóm */
    MentoringGroupResponse getGroup(String email, Long groupId);

    /** Lấy danh sách lời mời đang chờ của người dùng hiện tại */
    List<MentoringGroupResponse> getMyInvitations(String email);

    /** Lấy danh sách nhóm của người dùng (tất cả nhóm nhìn thấy) */
    List<MentoringGroupResponse> getMyGroups(String email);

    /** Lấy danh sách nhóm theo bộ lọc: ALL, MANAGED, JOINED */
    List<MentoringGroupResponse> getMyGroups(String email, String filter);

    /** Mời thêm thành viên vào nhóm */
    MentoringGroupResponse invite(String email, Long groupId, List<Long> userIds);

    /** Chấp nhận lời mời theo groupId */
    MentoringGroupResponse accept(String email, Long groupId);

    /** Chấp nhận lời mời theo invitationId */
    MentoringGroupResponse acceptInvitation(String email, Long invitationId);

    /** Từ chối lời mời theo groupId */
    MentoringGroupResponse decline(String email, Long groupId);

    /** Từ chối lời mời theo invitationId */
    MentoringGroupResponse declineInvitation(String email, Long invitationId);

    /** Hủy lời mời đang chờ (Leader only) */
    MentoringGroupResponse cancelInvitation(String email, Long groupId, Long invitationOrUserId);

    /** Xóa thành viên khỏi nhóm (Leader/Task mentor only) */
    MentoringGroupResponse remove(String email, Long groupId, Long userId);

    /** Rời khỏi nhóm (Member JOINED only, Leader không được rời khi chưa bàn giao) */
    MentoringGroupResponse leaveGroup(String email, Long groupId);

    /** Trưởng nhóm giải tán nhóm (xóa mềm sang CANCELLED) khi không còn request/task đang diễn ra. */
    void deleteGroup(String email, Long groupId);

    /** Lấy danh sách Mentoring Request liên kết với nhóm */
    List<MentoringGroupRequestSummaryResponse> getGroupRequests(String email, Long groupId);

    /** Kiểm tra xem user có phải thành viên active của request hay không */
    boolean isActiveMember(MentoringRequest request, Long userId);

    /** Đồng bộ thành viên snapshot vào conversation của Task */
    void synchronizeConversationParticipants(MentoringRequest request, Conversation conversation);
}
