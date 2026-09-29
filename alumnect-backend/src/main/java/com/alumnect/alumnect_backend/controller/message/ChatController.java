package com.alumnect.alumnect_backend.controller.message;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.message.AddMembersRequest;
import com.alumnect.alumnect_backend.dto.request.message.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.message.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserResponse;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.dto.response.message.ParticipantResponse;
import com.alumnect.alumnect_backend.service.message.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến chức năng Nhắn tin (1-1, nhóm chat, người lạ nhắn).
 * Tự động gắn tiền tố /api/v1 qua WebMvcConfig.
 */
@Tag(name = "Messaging", description = "Các API phục vụ nhắn tin trực tiếp 1-1, chat nhóm và tin nhắn chờ người lạ")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequiredArgsConstructor
@Validated
public class ChatController {

    private final ChatService chatService;

    private static final int MAX_PAGE_SIZE = 50;

    /**
     * Lấy danh sách cuộc hội thoại của người dùng theo tab (primary: Hộp thư chính, requests: Tin nhắn chờ).
     */
    @Operation(summary = "Lấy danh sách các cuộc trò chuyện của người dùng")
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @RequestParam(required = false, defaultValue = "primary") String tab) {
        String email = getAuthenticatedUserEmail();
        List<ConversationResponse> conversations = chatService.getConversations(email, tab);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hội thoại thành công.", conversations));
    }

    /**
     * Lấy hoặc chuẩn bị cuộc hội thoại trực tiếp 1-1 với một người dùng khác (chế độ Draft, không lưu DB nếu chưa gửi tin).
     */
    @Operation(summary = "Khởi tạo hoặc tìm cuộc hội thoại 1-1 với người dùng")
    @PostMapping("/conversations/direct/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getOrCreateDirectConversation(
            @PathVariable @Positive(message = "Mã người dùng phải là số nguyên dương.") Long targetUserId) {
        String email = getAuthenticatedUserEmail();
        ConversationResponse conversation = chatService.getOrCreateDirectConversation(email, targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Mở cuộc hội thoại thành công.", conversation));
    }

    /**
     * Lấy lịch sử tin nhắn trong một cuộc hội thoại có phân trang.
     */
    @Operation(summary = "Lấy lịch sử tin nhắn trong cuộc hội thoại (phân trang)")
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getMessages(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int limitedSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(Math.max(page, 0), limitedSize, Sort.by("createdAt").descending());

        String email = getAuthenticatedUserEmail();
        PageResponse<MessageResponse> messages = chatService.getMessages(email, conversationId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử tin nhắn thành công.", messages));
    }

    /**
     * Gửi tin nhắn mới (hỗ trợ văn bản và/hoặc tệp đính kèm).
     */
    @Operation(summary = "Gửi tin nhắn mới và phát realtime qua WebSocket")
    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {
        String email = getAuthenticatedUserEmail();
        MessageResponse response = chatService.sendMessage(email, request);
        return ResponseEntity.ok(ApiResponse.success("Gửi tin nhắn thành công.", response));
    }

    /**
     * Đánh dấu đã đọc tin nhắn trong cuộc hội thoại.
     */
    @Operation(summary = "Đánh dấu cuộc hội thoại là đã đọc")
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId) {
        String email = getAuthenticatedUserEmail();
        chatService.markAsRead(email, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc.", null));
    }

    /**
     * Chấp nhận cuộc trò chuyện từ người lạ (chuyển từ Tin nhắn chờ sang Hộp thư chính).
     */
    @Operation(summary = "Chấp nhận cuộc trò chuyện trong Tin nhắn chờ")
    @PostMapping("/conversations/{conversationId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptConversation(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId) {
        String email = getAuthenticatedUserEmail();
        chatService.acceptConversation(email, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã chấp nhận cuộc trò chuyện.", null));
    }

    /**
     * Xóa hoặc từ chối cuộc trò chuyện.
     */
    @Operation(summary = "Xóa cuộc trò chuyện hoặc từ chối tin nhắn chờ")
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId) {
        String email = getAuthenticatedUserEmail();
        chatService.deleteConversation(email, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa cuộc trò chuyện thành công.", null));
    }

    /**
     * Khởi tạo nhóm trò chuyện mới.
     */
    @Operation(summary = "Tạo nhóm trò chuyện mới")
    @PostMapping("/conversations/group")
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroup(
            @Valid @RequestBody CreateGroupRequest request) {
        String email = getAuthenticatedUserEmail();
        ConversationResponse response = chatService.createGroupConversation(email, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo nhóm trò chuyện thành công.", response));
    }

    /**
     * Cập nhật thông tin nhóm (Tên nhóm, ảnh nhóm).
     */
    @Operation(summary = "Cập nhật thông tin nhóm trò chuyện")
    @PutMapping("/conversations/{conversationId}/group")
    public ResponseEntity<ApiResponse<ConversationResponse>> updateGroup(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId,
            @Valid @RequestBody UpdateGroupRequest request) {
        String email = getAuthenticatedUserEmail();
        ConversationResponse response = chatService.updateGroup(email, conversationId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhóm thành công.", response));
    }

    /**
     * Thêm thành viên vào nhóm trò chuyện.
     */
    @Operation(summary = "Thêm thành viên vào nhóm trò chuyện")
    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ApiResponse<ConversationResponse>> addMembers(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId,
            @Valid @RequestBody AddMembersRequest request) {
        String email = getAuthenticatedUserEmail();
        ConversationResponse response = chatService.addMembers(email, conversationId, request);
        return ResponseEntity.ok(ApiResponse.success("Thêm thành viên vào nhóm thành công.", response));
    }

    /**
     * Xóa thành viên khỏi nhóm hoặc rời nhóm.
     */
    @Operation(summary = "Xóa thành viên khỏi nhóm hoặc rời nhóm")
    @DeleteMapping("/conversations/{conversationId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId,
            @PathVariable @Positive(message = "Mã người dùng phải là số nguyên dương.") Long userId,
            @RequestParam(name = "newAdminId", required = false) Long newAdminId) {
        String email = getAuthenticatedUserEmail();
        chatService.removeMember(email, conversationId, userId, newAdminId);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thành viên nhóm.", null));
    }

    /**
     * Lấy danh sách thành viên trong nhóm trò chuyện.
     */
    @Operation(summary = "Lấy danh sách thành viên trong nhóm trò chuyện")
    @GetMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ApiResponse<List<ParticipantResponse>>> getGroupMembers(
            @PathVariable @Positive(message = "Mã cuộc hội thoại phải là số nguyên dương.") Long conversationId) {
        String email = getAuthenticatedUserEmail();
        List<ParticipantResponse> members = chatService.getGroupMembers(email, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành viên thành công.", members));
    }

    /**
     * Tìm kiếm người dùng cho chức năng chat / tạo nhóm.
     */
    @Operation(summary = "Tìm kiếm người dùng cho tin nhắn và nhóm chat")
    @GetMapping("/conversations/users/search")
    public ResponseEntity<ApiResponse<List<ChatUserResponse>>> searchUsers(
            @RequestParam(required = false) String keyword) {
        String email = getAuthenticatedUserEmail();
        List<ChatUserResponse> users = chatService.searchUsersForChat(email, keyword);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm người dùng thành công.", users));
    }

    private String getAuthenticatedUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
