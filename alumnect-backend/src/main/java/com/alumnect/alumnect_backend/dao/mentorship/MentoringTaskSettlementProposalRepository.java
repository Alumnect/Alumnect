package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn các đề xuất thỏa thuận dừng Task và phân chia tiền (UC109).
 */
@Repository
public interface MentoringTaskSettlementProposalRepository extends JpaRepository<MentoringTaskSettlementProposal, Long> {

    /** Lấy toàn bộ lịch sử đề xuất phân chia tiền theo Task ID theo thứ tự mới nhất */
    List<MentoringTaskSettlementProposal> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy toàn bộ lịch sử đề xuất phân chia tiền theo Conversation ID */
    List<MentoringTaskSettlementProposal> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /** Tìm đề xuất đang PENDING của một Task */
    Optional<MentoringTaskSettlementProposal> findFirstByTaskIdAndStatusOrderByCreatedAtDesc(Long taskId, MentoringSettlementProposalStatus status);

    /** Lấy đề xuất đã được ACCEPTED của một Task */
    Optional<MentoringTaskSettlementProposal> findFirstByTaskIdAndStatus(Long taskId, MentoringSettlementProposalStatus status);
}
