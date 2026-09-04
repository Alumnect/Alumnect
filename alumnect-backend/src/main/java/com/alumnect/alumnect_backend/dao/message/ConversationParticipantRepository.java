package com.alumnect.alumnect_backend.dao.message;

import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository thao tác với bảng conversation_participants.
 */
@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {

    /**
     * Tìm thành viên tham gia hội thoại cụ thể theo mã hội thoại và mã người dùng.
     */
    Optional<ConversationParticipant> findByConversationIdAndUserId(Long conversationId, Long userId);

    /**
     * Lấy toàn bộ danh sách thành viên tham gia của một cuộc hội thoại.
     */
    List<ConversationParticipant> findByConversationId(Long conversationId);

    /**
     * Nạp toàn bộ danh sách thành viên tham gia của nhiều cuộc hội thoại cùng lúc kèm User và lastReadMessage (tránh N+1).
     */
    @Query("SELECT cp FROM ConversationParticipant cp " +
           "JOIN FETCH cp.user u " +
           "LEFT JOIN FETCH cp.lastReadMessage lrm " +
           "WHERE cp.conversation.id IN :conversationIds")
    List<ConversationParticipant> findByConversationIdInWithUserAndLastRead(@Param("conversationIds") List<Long> conversationIds);

    /**
     * Kiểm tra xem người dùng có phải là thành viên của cuộc hội thoại hay không.
     */
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);
}
