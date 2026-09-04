package com.alumnect.alumnect_backend.dao.message;

import com.alumnect.alumnect_backend.entity.message.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository thao tác với bảng messages.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Lấy danh sách tin nhắn theo cuộc hội thoại có phân trang (sắp xếp giảm dần theo thời gian tạo).
     */
    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    /**
     * Tìm tin nhắn mới nhất trong một cuộc hội thoại.
     */
    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /**
     * Đếm số lượng tin nhắn chưa đọc của một người dùng trong cuộc trò chuyện
     * (các tin nhắn sau last_read_message_id do người khác gửi).
     */
    long countByConversationIdAndIdGreaterThanAndSenderIdNot(Long conversationId, Long lastReadMessageId, Long senderId);

    /**
     * Đếm toàn bộ tin nhắn do người khác gửi trong cuộc trò chuyện (trường hợp chưa đọc tin nào - lastReadMessageId null).
     */
    long countByConversationIdAndSenderIdNot(Long conversationId, Long senderId);
}
