package com.alumnect.alumnect_backend.controller.group;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.group.ChangeMemberRoleRequest;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.group.HandleJoinRequestRequest;
import com.alumnect.alumnect_backend.dto.request.group.TransferOwnershipRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupStatusRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupActionResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupCardResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupDetailResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMemberResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMembershipResponse;
import com.alumnect.alumnect_backend.dto.response.group.JoinRequestResponse;
import com.alumnect.alumnect_backend.service.group.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller Hội nhóm cộng đồng (Community Groups), tiền tố global /api/v1/groups.
 * Các API GET công khai nhận Authentication tùy chọn: Guest xem được thông tin công khai, người đã đăng nhập
 * nhận thêm trạng thái tham gia của mình. Toàn bộ kiểm tra quyền nằm ở {@link GroupService}.
 */
@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    /** Danh sách khám phá hội nhóm — tìm theo từ khóa, lọc theo danh mục, phân trang. Công khai. */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<GroupCardResponse>>> listGroups(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication) {
        PageResponse<GroupCardResponse> result = groupService.listGroups(emailOrNull(authentication), keyword, category, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hội nhóm thành công", result));
    }

    /** Các hội nhóm tôi đang là thành viên. Yêu cầu JWT. */
    @GetMapping("/my-groups")
    public ResponseEntity<ApiResponse<PageResponse<GroupCardResponse>>> getMyGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication) {
        PageResponse<GroupCardResponse> result = groupService.getMyGroups(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hội nhóm của tôi thành công", result));
    }

    /** Chi tiết hội nhóm. Công khai; nhóm riêng tư chỉ trả thông tin được phép công khai cho người ngoài nhóm. */
    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupDetailResponse>> getGroupDetail(
            @PathVariable Long groupId,
            Authentication authentication) {
        GroupDetailResponse result = groupService.getGroupDetail(groupId, emailOrNull(authentication));
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết hội nhóm thành công", result));
    }

    /** Tạo hội nhóm mới — chỉ Student/Alumni; người tạo tự động là Owner và thành viên đầu tiên. */
    @PostMapping
    public ResponseEntity<ApiResponse<GroupDetailResponse>> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication) {
        GroupDetailResponse result = groupService.createGroup(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hội nhóm thành công!", result));
    }

    /** Cập nhật thông tin hội nhóm — Owner/Admin. */
    @PutMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupDetailResponse>> updateGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateGroupRequest request,
            Authentication authentication) {
        GroupDetailResponse result = groupService.updateGroup(groupId, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hội nhóm thành công!", result));
    }

    /** Đóng (INACTIVE) hoặc mở lại (ACTIVE) hội nhóm — chỉ Owner. */
    @PutMapping("/{groupId}/status")
    public ResponseEntity<ApiResponse<GroupActionResponse>> updateGroupStatus(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateGroupStatusRequest request,
            Authentication authentication) {
        GroupActionResponse result = groupService.updateGroupStatus(groupId, authentication.getName(), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    /** Xóa (mềm) hội nhóm — chỉ Owner. */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupActionResponse>> deleteGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        GroupActionResponse result = groupService.deleteGroup(groupId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    /** Tham gia nhóm công khai hoặc gửi yêu cầu tham gia nhóm riêng tư — Student/Alumni. */
    @PostMapping("/{groupId}/join")
    public ResponseEntity<ApiResponse<GroupMembershipResponse>> joinGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        GroupMembershipResponse result = groupService.joinGroup(groupId, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result.getMessage(), result));
    }

    /**
     * Rời nhóm hoặc hủy yêu cầu đang chờ duyệt. Owner còn thành viên khác phải gửi kèm body
     * {@code {"newOwnerId": ...}} để chuyển quyền sở hữu trước khi rời.
     */
    @DeleteMapping("/{groupId}/join")
    public ResponseEntity<ApiResponse<GroupMembershipResponse>> leaveGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody(required = false) TransferOwnershipRequest request,
            Authentication authentication) {
        Long transferTo = request != null ? request.getNewOwnerId() : null;
        GroupMembershipResponse result = groupService.leaveGroup(groupId, authentication.getName(), transferTo);
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    /** Danh sách thành viên. Công khai với nhóm PUBLIC; nhóm PRIVATE chỉ thành viên ACTIVE xem được. */
    @GetMapping("/{groupId}/members")
    public ResponseEntity<ApiResponse<PageResponse<GroupMemberResponse>>> getMembers(
            @PathVariable Long groupId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        PageResponse<GroupMemberResponse> result = groupService.getMembers(groupId, emailOrNull(authentication), keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành viên thành công", result));
    }

    /** Danh sách yêu cầu tham gia đang chờ duyệt — Owner/Admin. */
    @GetMapping("/{groupId}/join-requests")
    public ResponseEntity<ApiResponse<PageResponse<JoinRequestResponse>>> getJoinRequests(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        PageResponse<JoinRequestResponse> result = groupService.getJoinRequests(groupId, authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu tham gia thành công", result));
    }

    /** Duyệt hoặc từ chối một yêu cầu tham gia — Owner/Admin. */
    @PutMapping("/{groupId}/join-requests/{requestId}")
    public ResponseEntity<ApiResponse<GroupActionResponse>> handleJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            @Valid @RequestBody HandleJoinRequestRequest request,
            Authentication authentication) {
        GroupActionResponse result = groupService.handleJoinRequest(groupId, requestId, authentication.getName(), request.getAction());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    /** Xóa thành viên khỏi nhóm — Owner (xóa bất kỳ ai trừ chính mình) / Admin (chỉ xóa Member thường). */
    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupActionResponse>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            Authentication authentication) {
        GroupActionResponse result = groupService.removeMember(groupId, userId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    /** Phân quyền / thu hồi quyền quản trị viên — chỉ Owner. */
    @PutMapping("/{groupId}/members/{userId}/role")
    public ResponseEntity<ApiResponse<GroupActionResponse>> changeMemberRole(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @Valid @RequestBody ChangeMemberRoleRequest request,
            Authentication authentication) {
        GroupActionResponse result = groupService.changeMemberRole(groupId, userId, authentication.getName(), request.getRole());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    private String emailOrNull(Authentication authentication) {
        boolean authenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
        return authenticated ? authentication.getName() : null;
    }
}
