package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn bằng chứng tranh chấp của Ticket (UC112 & UC113).
 */
@Repository
public interface MentoringTicketEvidenceRepository extends JpaRepository<MentoringTicketEvidence, Long> {

    /** Lấy danh sách bằng chứng theo Ticket ID theo thứ tự thời gian tạo */
    List<MentoringTicketEvidence> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
