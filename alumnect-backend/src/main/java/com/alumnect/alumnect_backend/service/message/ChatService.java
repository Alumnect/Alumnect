package com.alumnect.alumnect_backend.service.message;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface định nghĩa các nghiệp vụ cốt lõi cho chức năng Nhắn tin 1-1 (UC33 - Direct Messaging).
 */
public interface ChatService {

    /**
     * Lấy danh sách toàn bộ các cuộc hội thoại của người dùng hiện tại,
     * sắp xếp theo thời gian có tin nhắn mới nhất giảm dần.
     */
    List<ConversationResponse> getConversations(String currentUserEmail);

    /**
     * Lấy hoặc khởi tạo mới cuộc trò chuyện trực tiếp 1-1 giữa người dùng hiện tại và đối phương.
     */
    ConversationResponse getOrCreateDirectConversation(String currentUserEmail, Long targetUserId);

    /**
     * Lấy lịch sử tin nhắn trong một cuộc hội thoại có phân trang.
     */
    PageResponse<MessageResponse> getMessages(String currentUserEmail, Long conversationId, Pageable pageable);

    /**
     * Gửi tin nhắn mới (văn bản hoặc tệp đính kèm) trong cuộc trò chuyện,
     * tự động lưu DB và bắn tin nhắn realtime tới người nhận qua WebSocket STOMP.
     */
    MessageResponse sendMessage(String currentUserEmail, SendMessageRequest request);

    /**
     * Đánh dấu cuộc hội thoại là đã đọc tin nhắn mới nhất.
     */
    void markAsRead(String currentUserEmail, Long conversationId);

}
