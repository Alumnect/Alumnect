package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.InviteMentoringGroupMembersRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupMemberResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupRequestSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến nhóm Mentoring (mô hình Group-First, UC122).
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@RestController
@RequestMapping({"/mentoring/groups", "/api/v1/mentoring/groups"})
@RequiredArgsConstructor
@Tag(name = "Mentoring Groups", description = "Quản lý nhóm Mentoring theo mô hình Group-First (UC122)")
public class MentoringGroupController {

    private final MentoringGroupService service;

    private String email() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    @Operation(summary = "Tạo mới nhóm Mentoring độc lập (Leader tự động tham gia)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> createGroup(
            @Valid @RequestBody CreateMentoringGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nhóm mentoring thành công", service.createGroup(email(), request)));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách nhóm của tôi (bộ lọc: ALL, MANAGED, JOINED)")
    public ResponseEntity<ApiResponse<List<MentoringGroupResponse>>> listGroups(
            @RequestParam(required = false, defaultValue = "ALL") String filter) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhóm thành công", service.getMyGroups(email(), filter)));
    }

    @GetMapping("/mine")
    @Operation(summary = "Lấy danh sách nhóm của tôi (tương thích ngược)")
    public ResponseEntity<ApiResponse<List<MentoringGroupResponse>>> mine() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhóm thành công", service.getMyGroups(email())));
    }

    @GetMapping({"/invitations/mine", "/my-invitations"})
    @Operation(summary = "Lấy danh sách lời mời vào nhóm đang chờ phản hồi")
    public ResponseEntity<ApiResponse<List<MentoringGroupResponse>>> invitations() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lời mời thành công", service.getMyInvitations(email())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết nhóm Mentoring")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhóm thành công", service.getGroup(email(), id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Cập nhật tên, mô tả hoặc đóng/mở lại nhóm Mentoring")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> update(
            @PathVariable Long id, @Valid @RequestBody UpdateMentoringGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhóm thành công", service.updateGroup(email(), id, request)));
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "Lấy danh sách thành viên của nhóm")
    public ResponseEntity<ApiResponse<List<MentoringGroupMemberResponse>>> members(@PathVariable Long id) {
        MentoringGroupResponse group = service.getGroup(email(), id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành viên thành công", group.getMembers()));
    }

    @GetMapping("/{id}/invitations")
    @Operation(summary = "Lấy danh sách lời mời đang chờ của nhóm (Leader only)")
    public ResponseEntity<ApiResponse<List<MentoringGroupMemberResponse>>> groupInvitations(@PathVariable Long id) {
        MentoringGroupResponse group = service.getGroup(email(), id);
        List<MentoringGroupMemberResponse> pending = group.getMembers().stream()
                .filter(m -> m.getStatus().isPending())
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lời mời của nhóm thành công", pending));
    }

    @GetMapping("/{id}/requests")
    @Operation(summary = "Lấy danh sách Mentoring Request liên kết với nhóm")
    public ResponseEntity<ApiResponse<List<MentoringGroupRequestSummaryResponse>>> groupRequests(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu của nhóm thành công", service.getGroupRequests(email(), id)));
    }

    @PostMapping({"/{id}/members", "/{id}/invitations"})
    @Operation(summary = "Gửi lời mời tham gia nhóm cho một hoặc nhiều người dùng")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> invite(
            @PathVariable Long id, @Valid @RequestBody InviteMentoringGroupMembersRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã gửi lời mời tham gia nhóm", service.invite(email(), id, request.getUserIds())));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Chấp nhận lời mời tham gia nhóm theo groupId")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> accept(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã tham gia nhóm thành công", service.accept(email(), id)));
    }

    @PostMapping("/{id}/decline")
    @Operation(summary = "Từ chối lời mời tham gia nhóm theo groupId")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> decline(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối lời mời tham gia nhóm", service.decline(email(), id)));
    }

    @PostMapping("/invitations/{invitationId}/accept")
    @Operation(summary = "Chấp nhận lời mời tham gia nhóm theo invitationId (dùng cho Notification action)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> acceptInvitation(@PathVariable Long invitationId) {
        return ResponseEntity.ok(ApiResponse.success("Đã tham gia nhóm thành công", service.acceptInvitation(email(), invitationId)));
    }

    @PostMapping("/invitations/{invitationId}/decline")
    @Operation(summary = "Từ chối lời mời tham gia nhóm theo invitationId (dùng cho Notification action)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> declineInvitation(@PathVariable Long invitationId) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối lời mời tham gia nhóm", service.declineInvitation(email(), invitationId)));
    }

    @PostMapping({"/invitations/{invitationId}/cancel", "/{id}/invitations/{invitationId}/cancel"})
    @Operation(summary = "Hủy lời mời đang chờ (Leader only)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> cancelInvitation(
            @PathVariable(required = false) Long id, @PathVariable Long invitationId) {
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lời mời thành công", service.cancelInvitation(email(), id != null ? id : 0L, invitationId)));
    }

    @PostMapping("/{id}/cancel-invitation/{userId}")
    @Operation(summary = "Hủy lời mời đang chờ theo userId của người được mời (Leader only)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> cancelInvitationByUser(
            @PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lời mời thành công", service.cancelInvitation(email(), id, userId)));
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Rời khỏi nhóm Mentoring (Thành viên đã tham gia)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> leave(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Bạn đã rời khỏi nhóm thành công", service.leaveGroup(email(), id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Giải tán nhóm Mentoring (Leader only)")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        service.deleteGroup(email(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã giải tán nhóm mentoring", null));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Xóa thành viên khỏi nhóm Mentoring (Leader only)")
    public ResponseEntity<ApiResponse<MentoringGroupResponse>> remove(
            @PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thành viên khỏi nhóm", service.remove(email(), id, userId)));
    }
}
