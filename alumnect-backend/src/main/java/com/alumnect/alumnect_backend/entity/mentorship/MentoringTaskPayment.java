package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Mentoring Task Payment lưu vết giao dịch thanh toán nhiệm vụ hướng dẫn qua cổng PayOS (UC105).
 * Tách biệt hoàn toàn với giao dịch mua gói Mentor Subscription (UC93).
 */
@Entity
@Table(name = "mentoring_task_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Thỏa thuận Deal được thanh toán */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false)
    private MentoringDeal deal;

    /** Người thực hiện thanh toán (Student) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Task Mentoring được kích hoạt sau khi thanh toán thành công (nullable ban đầu) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private MentoringTask task;

    /** Mã đơn hàng PayOS duy nhất (orderCode kiểu số nguyên 53-bit) */
    @Column(name = "order_code", nullable = false, unique = true)
    private Long orderCode;

    /** Số tiền thanh toán (VND) */
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    /** Trạng thái thanh toán: PENDING, PAID, FAILED, EXPIRED, CANCELLED */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20, nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /** Phương thức thanh toán: PAYOS */
    @Column(name = "payment_method", length = 50, nullable = false)
    @Builder.Default
    private String paymentMethod = "PAYOS";

    /** ID của liên kết thanh toán từ PayOS (paymentLinkId) */
    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    /** Nội dung chuyển khoản */
    @Column(name = "description", length = 255)
    private String description;

    /** Chuỗi mã QR VietQR từ PayOS */
    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl;

    /** Đường dẫn trang thanh toán PayOS Checkout */
    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    /** Số tài khoản thụ hưởng */
    @Column(name = "account_number", length = 50)
    private String accountNumber;

    /** Tên chủ tài khoản thụ hưởng */
    @Column(name = "account_name", length = 150)
    private String accountName;

    /** Mã định danh ngân hàng (BIN) */
    @Column(name = "bin", length = 20)
    private String bin;

    /** Thời điểm hết hạn thanh toán đơn hàng */
    @Column(name = "payment_expires_at", nullable = false)
    private Instant paymentExpiresAt;

    /** Thời điểm thanh toán thành công */
    @Column(name = "paid_at")
    private Instant paidAt;

    /** Thời điểm tạo giao dịch */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật giao dịch */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
