package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn dữ liệu Sổ quỹ giao dịch Mentoring (mentoring_payment_ledgers).
 */
@Repository
public interface MentoringPaymentLedgerRepository extends JpaRepository<MentoringPaymentLedger, Long> {

    Optional<MentoringPaymentLedger> findByPaymentIdAndTransactionType(Long paymentId, MentoringLedgerTransactionType transactionType);

    boolean existsByPaymentIdAndTransactionType(Long paymentId, MentoringLedgerTransactionType transactionType);

    List<MentoringPaymentLedger> findByRequestId(Long requestId);

    List<MentoringPaymentLedger> findByTaskId(Long taskId);

    List<MentoringPaymentLedger> findByDealId(Long dealId);
}
