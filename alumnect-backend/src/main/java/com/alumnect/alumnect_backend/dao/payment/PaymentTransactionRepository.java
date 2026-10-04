package com.alumnect.alumnect_backend.dao.payment;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Interface Repository thao tác với bảng payment_transactions trong CSDL.
 * Cung cấp các phương thức truy vấn thông tin giao dịch và hỗ trợ khóa bi quan (Pessimistic Lock)
 * phục vụ đối soát Webhook an toàn, chống race condition.
 */
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    /**
     * Tìm giao dịch thanh toán theo mã đơn hàng orderCode.
     *
     * @param orderCode Mã đơn hàng PayOS
     * @return Optional chứa thông tin giao dịch nếu tìm thấy
     */
    Optional<PaymentTransaction> findByOrderCode(Long orderCode);

    /**
     * Tìm giao dịch theo mã đơn hàng và ID người dùng (kiểm tra phân quyền sở hữu).
     *
     * @param orderCode Mã đơn hàng PayOS
     * @param userId ID người dùng sở hữu giao dịch
     * @return Optional chứa thông tin giao dịch
     */
    Optional<PaymentTransaction> findByOrderCodeAndUserId(Long orderCode, Long userId);

    /**
     * Khóa bi quan (Pessimistic Write Lock) bản ghi giao dịch theo orderCode khi xử lý Webhook IPN từ PayOS.
     * Đảm bảo tính toán toàn vẹn và chống callback lặp lại dồn dập đồng thời.
     *
     * @param orderCode Mã đơn hàng PayOS cần khóa
     * @return Optional chứa giao dịch đã được khóa ghi
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.orderCode = :orderCode")
    Optional<PaymentTransaction> findForUpdateByOrderCode(@Param("orderCode") Long orderCode);

    /**
     * Lấy giao dịch mới nhất của một subscription cụ thể (thay thế FK ngược).
     *
     * @param mentorSubscriptionId ID của đăng ký gói Mentor
     * @return Giao dịch gần nhất nếu có
     */
    Optional<PaymentTransaction> findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(Long mentorSubscriptionId);

    /**
     * Tìm giao dịch đang ở trạng thái PENDING mới nhất của người dùng.
     *
     * @param userId ID người dùng
     * @param status Trạng thái thanh toán (ví dụ: PENDING)
     * @return Giao dịch thỏa mãn nếu có
     */
    Optional<PaymentTransaction> findFirstByUserIdAndPaymentStatusOrderByCreatedAtDesc(Long userId, PaymentStatus status);

    /**
     * Lấy toàn bộ lịch sử giao dịch của người dùng sắp xếp theo thời gian tạo giảm dần.
     *
     * @param userId ID người dùng
     * @return Danh sách các giao dịch
     */
    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
