package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phản hồi chi tiết thanh toán Task bao gồm thông tin VietQR và PayOS link (UC105).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskPaymentCheckoutResponse {

    /** ID bản ghi giao dịch trong cơ sở dữ liệu */
    private Long paymentId;

    /** ID thỏa thuận Deal */
    private Long dealId;

    /** Tiêu đề Task / Nhiệm vụ */
    private String taskTitle;

    /** Tên người hướng dẫn (Mentor) nhận tiền */
    private String mentorName;

    /** Mã đơn hàng PayOS duy nhất */
    private Long orderCode;

    /** Số tiền thanh toán (VND) */
    private BigDecimal amount;

    /** Nội dung chuyển khoản */
    private String description;

    /** Chuỗi QR VietQR từ PayOS */
    private String qrCodeUrl;

    /** Đường dẫn mở trang thanh toán PayOS Checkout */
    private String checkoutUrl;

    /** Số tài khoản ngân hàng thụ hưởng */
    private String accountNumber;

    /** Tên chủ tài khoản thụ hưởng */
    private String accountName;

    /** Mã định danh ngân hàng (BIN) */
    private String bin;

    /** Trạng thái thanh toán hiện tại */
    private PaymentStatus paymentStatus;

    /** Thời điểm hết hạn thanh toán */
    private Instant paymentExpiresAt;

    /** Thời điểm thanh toán thành công (nếu có) */
    private Instant paidAt;
}
