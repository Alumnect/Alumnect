package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn dữ liệu Mentoring Task Payment (UC105).
 */
@Repository
public interface MentoringTaskPaymentRepository extends JpaRepository<MentoringTaskPayment, Long> {

    /** Tìm giao dịch theo mã đơn hàng PayOS */
    Optional<MentoringTaskPayment> findByOrderCode(Long orderCode);

    boolean existsByOrderCode(Long orderCode);

    @Query("SELECT p.orderCode FROM MentoringTaskPayment p WHERE p.paymentStatus = com.alumnect.alumnect_backend.common.enums.PaymentStatus.PENDING")
    List<Long> findPendingOrderCodes();

    /** Tìm và khóa bi quan (Pessimistic Write Lock) theo orderCode chống race-condition trong Webhook & Polling */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM MentoringTaskPayment p WHERE p.orderCode = :orderCode")
    Optional<MentoringTaskPayment> findForUpdateByOrderCode(@Param("orderCode") Long orderCode);

    /** Tìm giao dịch thanh toán PENDING gần nhất của một Deal */
    Optional<MentoringTaskPayment> findFirstByDealIdAndPaymentStatusOrderByCreatedAtDesc(Long dealId, PaymentStatus status);

    /** Tìm tất cả giao dịch thanh toán của một Deal */
    List<MentoringTaskPayment> findByDealIdOrderByCreatedAtDesc(Long dealId);

    /** Giao dịch top-up đang chờ của một Ticket điều chỉnh */
    Optional<MentoringTaskPayment> findFirstByAmendmentIdAndPaymentStatusOrderByCreatedAtDesc(Long amendmentId, PaymentStatus status);

    List<MentoringTaskPayment> findByAmendmentIdAndPaymentStatus(Long amendmentId, PaymentStatus status);

    /** Tìm giao dịch thanh toán đã thành công (PAID) của một Deal */
    Optional<MentoringTaskPayment> findFirstByDealIdAndPaymentStatus(Long dealId, PaymentStatus status);

    /** Tìm giao dịch thanh toán PENDING của một Request */
    Optional<MentoringTaskPayment> findFirstByRequestIdAndPaymentStatusOrderByCreatedAtDesc(Long requestId, PaymentStatus status);

    /** Tìm tất cả giao dịch thanh toán theo Request và trạng thái */
    List<MentoringTaskPayment> findByRequestIdAndPaymentStatus(Long requestId, PaymentStatus status);
}
