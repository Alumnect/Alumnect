package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

/**
 * Repository truy vấn dữ liệu Sổ quỹ giao dịch Mentoring (mentoring_payment_ledgers).
 */
@Repository
public interface MentoringPaymentLedgerRepository extends JpaRepository<MentoringPaymentLedger, Long> {

    Optional<MentoringPaymentLedger> findByPaymentIdAndTransactionType(Long paymentId, MentoringLedgerTransactionType transactionType);

    boolean existsByPaymentIdAndTransactionType(Long paymentId, MentoringLedgerTransactionType transactionType);

    List<MentoringPaymentLedger> findByRequestId(Long requestId);

    List<MentoringPaymentLedger> findByTaskId(Long taskId);

    /** Lịch sử chi thù lao của một Mentor */
    List<MentoringPaymentLedger> findByMentorIdAndTransactionTypeOrderByCreatedAtDesc(Long mentorId, MentoringLedgerTransactionType transactionType);

    /** Lịch sử hoàn tiền của một Học viên */
    List<MentoringPaymentLedger> findByStudentIdAndTransactionTypeOrderByCreatedAtDesc(Long studentId, MentoringLedgerTransactionType transactionType);

    List<MentoringPaymentLedger> findByDealId(Long dealId);

    Optional<MentoringPaymentLedger> findFirstByTaskIdAndTransactionTypeOrderByCreatedAtDesc(
            Long taskId, MentoringLedgerTransactionType transactionType);

    List<MentoringPaymentLedger> findByTransactionTypeAndStatus(
            MentoringLedgerTransactionType transactionType, MentoringLedgerStatus status);

    /** Khóa bản ghi lệnh chi để không có hai luồng cùng gửi một payout sang PayOS. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM MentoringPaymentLedger l WHERE l.id = :id")
    Optional<MentoringPaymentLedger> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT l.id FROM MentoringPaymentLedger l WHERE l.transactionType = :type AND l.status = :status ORDER BY l.createdAt")
    List<Long> findIdsByTransactionTypeAndStatus(@Param("type") MentoringLedgerTransactionType type,
                                                 @Param("status") MentoringLedgerStatus status);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM MentoringPaymentLedger l " +
           "WHERE l.transactionType = :type AND l.status = :status")
    BigDecimal sumAmountByTypeAndStatus(@Param("type") MentoringLedgerTransactionType type,
                                        @Param("status") MentoringLedgerStatus status);
}
