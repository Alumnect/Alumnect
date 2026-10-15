package com.alumnect.alumnect_backend.dao.message;

import com.alumnect.alumnect_backend.entity.message.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

/**
 * Repository thao tác với bảng messages.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Lấy danh sách tin nhắn theo cuộc hội thoại có phân trang (sắp xếp giảm dần theo thời gian tạo).
     */
    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    Page<Message> findByConversationIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            Long conversationId, Instant joinedAt, Pageable pageable);

    /**
     * Tìm tin nhắn mới nhất trong một cuộc hội thoại.
     */
    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /**
     * Lấy ID tin nhắn mới nhất của từng cuộc hội thoại (dùng PostgreSQL DISTINCT ON).
     */
    @Query(value = "SELECT DISTINCT ON (m.conversation_id) m.id FROM messages m " +
            "JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = :currentUserId " +
            "WHERE m.conversation_id IN :conversationIds AND m.created_at >= cp.joined_at " +
            "ORDER BY m.conversation_id, m.created_at DESC",
           nativeQuery = true)
    List<Long> findLatestMessageIdsByConversationIds(@Param("conversationIds") List<Long> conversationIds,
                                                      @Param("currentUserId") Long currentUserId);

    /**
     * Nạp tin nhắn kèm tệp đính kèm theo danh sách ID.
     */
    @Query("SELECT DISTINCT m FROM Message m LEFT JOIN FETCH m.attachments WHERE m.id IN :messageIds")
    List<Message> findMessagesWithAttachmentsByIdIn(@Param("messageIds") List<Long> messageIds);

    /**
     * Đếm số lượng tin nhắn chưa đọc theo từng cuộc hội thoại trong 1 query duy nhất (tránh N+1).
     * Trả về Object[] gồm [conversation_id, count].
     */
    @Query(value = "SELECT m.conversation_id, COUNT(m.id) " +
                   "FROM messages m " +
                   "JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = :currentUserId " +
                   "WHERE m.conversation_id IN :conversationIds " +
                   "  AND m.sender_id != :currentUserId " +
                   "  AND m.created_at >= cp.joined_at " +
                   "  AND (cp.last_read_message_id IS NULL OR m.id > cp.last_read_message_id) " +
                   "GROUP BY m.conversation_id",
           nativeQuery = true)
    List<Object[]> countUnreadGroupedByConversation(
            @Param("conversationIds") List<Long> conversationIds,
            @Param("currentUserId") Long currentUserId
    );
}
