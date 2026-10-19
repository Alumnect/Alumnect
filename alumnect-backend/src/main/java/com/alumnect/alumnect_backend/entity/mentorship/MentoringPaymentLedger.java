package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Sổ quỹ giao dịch Mentoring (Escrow, Payout, Refund).
 * Lưu vết dòng tiền thực tế, đối soát và đảm bảo tính bất biến/kiểm toán tài chính (UC105, UC118).
 */
@Entity
@Table(name = "mentoring_payment_ledgers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringPaymentLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Giao dịch thanh toán liên kết (nếu có) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private MentoringTaskPayment payment;

    /** Yêu cầu Mentoring gốc */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private MentoringRequest request;

    /** Task Mentoring được kích hoạt (nullable nếu là giai đoạn trước Task hoặc hoàn hủy) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private MentoringTask task;

    /** Thỏa thuận Deal tương ứng */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false)
    private MentoringDeal deal;

    /** Học viên liên quan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Cố vấn liên quan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    /** Số tiền giao dịch (VND) */
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    /** Loại giao dịch: ESCROW_COLLECTION, PAYOUT, REFUND */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 30, nullable = false)
    private MentoringLedgerTransactionType transactionType;

    /** Trạng thái giao dịch: PENDING, SUCCEEDED, FAILED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private MentoringLedgerStatus status;

    /** Mã tham chiếu từ nhà cung cấp cổng thanh toán (ví dụ: PayOS paymentLinkId / transactionId / orderCode) */
    @Column(name = "provider_reference", length = 150)
    private String providerReference;

    /** Khóa chống gửi trùng sang PayOS, ổn định theo nghiệp vụ. */
    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;

    @Column(name = "provider_transaction_id", length = 150)
    private String providerTransactionId;

    @Column(name = "provider_status", length = 50)
    private String providerStatus;

    @Column(name = "failure_code", length = 100)
    private String failureCode;

    @Column(name = "transacted_at")
    private Instant transactedAt;

    /** Snapshot hạn chót nhiệm vụ tại thời điểm ghi sổ quỹ */
    @Column(name = "deadline_snapshot")
    private Instant deadlineSnapshot;

    /** Ghi chú giải trình hoặc chi tiết giao dịch */
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /** Thời điểm tạo bản ghi */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
