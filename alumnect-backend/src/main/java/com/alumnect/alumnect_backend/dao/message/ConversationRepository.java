package com.alumnect.alumnect_backend.dao.message;

import com.alumnect.alumnect_backend.entity.message.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository thao tác với bảng conversations.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Tìm cuộc hội thoại trực tiếp theo directKey (min_max của 2 user IDs).
     */
    Optional<Conversation> findByDirectKey(String directKey);

    /**
     * Tìm cuộc hội thoại trực tiếp 1-1 giữa 2 người dùng.
     * Đảm bảo cuộc trò chuyện có đúng 2 thành viên và gồm user1Id lẫn user2Id.
     */
    @Query("SELECT c FROM Conversation c " +
           "WHERE (SELECT COUNT(cp) FROM ConversationParticipant cp WHERE cp.conversation = c) = 2 " +
           "AND EXISTS (SELECT 1 FROM ConversationParticipant cp1 WHERE cp1.conversation = c AND cp1.user.id = :user1Id) " +
           "AND EXISTS (SELECT 1 FROM ConversationParticipant cp2 WHERE cp2.conversation = c AND cp2.user.id = :user2Id)")
    Optional<Conversation> findDirectConversationBetween(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    /**
     * Lấy toàn bộ các cuộc hội thoại mà một người dùng tham gia,
     * sắp xếp theo thời điểm có tin nhắn mới nhất giảm dần.
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN c.participants cp " +
           "WHERE cp.user.id = :userId " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findConversationsByUserId(@Param("userId") Long userId);
}
