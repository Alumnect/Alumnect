package com.alumnect.alumnect_backend.controller.message;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.service.message.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến chức năng Nhắn tin trực tiếp 1-1 (UC33 - Direct Messaging).
 * Tự động gắn tiền tố /api/v1 qua WebMvcConfig.
 */
@Tag(name = "Direct Messaging", description = "Các API phục vụ nhắn tin trực tiếp 1-1 và quản lý cuộc hội thoại")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequiredArgsConstructor
@Validated
@Slf4j
public class ChatController {

    private final ChatService chatService;

    private static final int MAX_PAGE_SIZE = 50;

    /**
     * Lấy danh sách toàn bộ cuộc hội thoại của người dùng hiện tại.
     */
    @Operation(summary = "Lấy danh sách các cuộc trò chuyện của người dùng")
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations() {
        String email = getAuthenticatedUserEmail();
        List<ConversationResponse> conversations = chatService.getConversations(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hội thoại thành công.", conversations));
    }


    /**
     * Lấy hoặc tạo mới cuộc hội thoại trực tiếp 1-1 với một người dùng khác.
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

    private String getAuthenticatedUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
