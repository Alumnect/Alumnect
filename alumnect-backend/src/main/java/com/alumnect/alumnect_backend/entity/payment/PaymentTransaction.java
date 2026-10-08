package com.alumnect.alumnect_backend.entity.payment;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.common.enums.TransactionType;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể ánh xạ bảng payment_transactions trong cơ sở dữ liệu.
 * Đại diện cho một giao dịch thanh toán qua cổng PayOS nhằm kích hoạt hoặc gia hạn Mentor Subscription (UC93).
 */
@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng thực hiện thanh toán giao dịch (FK trỏ tới users.id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Đăng ký gói Mentor gắn liền với giao dịch này (FK một chiều tới mentor_subscriptions.id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_subscription_id", nullable = false)
    private MentorSubscription mentorSubscription;

    /** Mã đơn hàng thanh toán duy nhất số nguyên 53-bit cấp cho PayOS và đối soát VietQR */
    @Column(name = "order_code", nullable = false, unique = true)
    private Long orderCode;

    /** Số tiền thanh toán thực tế (VND) được snapshot từ gói dịch vụ trong DB */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Loại giao dịch nghiệp vụ (ví dụ: MENTOR_SUBSCRIPTION) */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    @Builder.Default
    private TransactionType transactionType = TransactionType.MENTOR_SUBSCRIPTION;

    /** Trạng thái thanh toán của giao dịch (PENDING, PAID, FAILED, EXPIRED, CANCELLED) */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /** Phương thức thanh toán (mặc định: PAYOS) */
    @Column(name = "payment_method", nullable = false, length = 50)
    @Builder.Default
    private String paymentMethod = "PAYOS";

    /** Mã định danh giao dịch thanh toán do PayOS trả về (paymentLinkId) */
    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    /** Nội dung chuyển khoản / mô tả đơn hàng (tối đa 25 ký tự theo quy định PayOS) */
    @Column(name = "description", length = 255)
    private String description;

    /** Chuỗi dữ liệu VietQR hoặc đường dẫn mã QR Code PayOS */
    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl;

    /** Đường dẫn mở trang thanh toán PayOS Checkout trực tiếp */
    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    /** Thời điểm hết hạn phiên thanh toán của đơn hàng PayOS */
    @Column(name = "payment_expires_at", nullable = false)
    private Instant paymentExpiresAt;

    /** Số tài khoản ngân hàng thụ hưởng VietQR từ PayOS */
    @Column(name = "account_number", length = 50)
    private String accountNumber;

    /** Tên chủ tài khoản ngân hàng thụ hưởng VietQR từ PayOS */
    @Column(name = "account_name", length = 100)
    private String accountName;

    /** Mã định danh ngân hàng (BIN) VietQR từ PayOS */
    @Column(name = "bin", length = 20)
    private String bin;

    /** Thời điểm thanh toán thành công được ghi nhận từ Webhook PayOS */
    @Column(name = "paid_at")
    private Instant paidAt;

    /** Thời điểm khởi tạo giao dịch */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật trạng thái giao dịch gần nhất */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.PENDING;
        }
        if (transactionType == null) {
            transactionType = TransactionType.MENTOR_SUBSCRIPTION;
        }
        if (paymentMethod == null) {
            paymentMethod = "PAYOS";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
