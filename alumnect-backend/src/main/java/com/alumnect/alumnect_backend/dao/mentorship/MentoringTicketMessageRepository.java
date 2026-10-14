package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn tin nhắn và thảo luận trong Ticket tranh chấp (UC119).
 */
@Repository
public interface MentoringTicketMessageRepository extends JpaRepository<MentoringTicketMessage, Long> {

    /** Lấy danh sách tin nhắn theo Ticket ID theo thứ tự thời gian tăng dần */
    @Query("SELECT m FROM MentoringTicketMessage m JOIN FETCH m.sender WHERE m.ticket.id = :ticketId ORDER BY m.createdAt ASC")
    List<MentoringTicketMessage> findByTicketIdWithSenderOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    List<MentoringTicketMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
