package com.alumnect.alumnect_backend.service.message;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.message.AddMembersRequest;
import com.alumnect.alumnect_backend.dto.request.message.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.request.message.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.dto.response.message.ParticipantResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface định nghĩa các nghiệp vụ cốt lõi cho chức năng Nhắn tin (Trực tiếp 1-1, Nhắn tin nhóm, Người lạ nhắn).
 */
public interface ChatService {

    /**
     * Lấy danh sách cuộc hội thoại của người dùng theo tab (primary: Hộp thư chính, requests: Tin nhắn chờ).
     */
    List<ConversationResponse> getConversations(String currentUserEmail, String tab);

    /**
     * Lấy hoặc chuẩn bị cuộc trò chuyện trực tiếp 1-1 giữa người dùng hiện tại và đối phương (cơ chế Draft).
     */
    ConversationResponse getOrCreateDirectConversation(String currentUserEmail, Long targetUserId);

    /**
     * Lấy lịch sử tin nhắn trong một cuộc hội thoại có phân trang.
     */
    PageResponse<MessageResponse> getMessages(String currentUserEmail, Long conversationId, Pageable pageable);

    /**
     * Gửi tin nhắn mới (văn bản hoặc tệp đính kèm) trong cuộc trò chuyện (cả 1-1 lẫn Group),
     * tự động lưu DB và bắn tin nhắn realtime tới các thành viên qua WebSocket STOMP.
     */
    MessageResponse sendMessage(String currentUserEmail, SendMessageRequest request);

    /**
     * Đánh dấu cuộc hội thoại là đã đọc tin nhắn mới nhất.
     */
    void markAsRead(String currentUserEmail, Long conversationId);

    /**
     * Chấp nhận cuộc trò chuyện trong Tin nhắn chờ (từ người lạ).
     */
    void acceptConversation(String currentUserEmail, Long conversationId);

    /**
     * Xóa hoặc từ chối cuộc trò chuyện.
     */
    void deleteConversation(String currentUserEmail, Long conversationId);

    /**
     * Khởi tạo nhóm trò chuyện mới.
     */
    ConversationResponse createGroupConversation(String currentUserEmail, CreateGroupRequest request);

    /**
     * Cập nhật thông tin nhóm (Tên nhóm, ảnh nhóm).
     */
    ConversationResponse updateGroup(String currentUserEmail, Long conversationId, UpdateGroupRequest request);

    /**
     * Thêm thành viên mới vào nhóm trò chuyện.
     */
    ConversationResponse addMembers(String currentUserEmail, Long conversationId, AddMembersRequest request);

    /**
     * Xóa thành viên khỏi nhóm hoặc tự rời khỏi nhóm (kèm chỉ định trưởng nhóm mới nếu là admin).
     */
    void removeMember(String currentUserEmail, Long conversationId, Long userId, Long newAdminId);

    /**
     * Lấy danh sách thành viên trong cuộc hội thoại / nhóm chat.
     */
    List<ParticipantResponse> getGroupMembers(String currentUserEmail, Long conversationId);

    /**
     * Tìm kiếm thành viên cho chức năng chat / tạo nhóm.
     */
    List<com.alumnect.alumnect_backend.dto.response.message.ChatUserResponse> searchUsersForChat(String currentUserEmail, String keyword);
}
