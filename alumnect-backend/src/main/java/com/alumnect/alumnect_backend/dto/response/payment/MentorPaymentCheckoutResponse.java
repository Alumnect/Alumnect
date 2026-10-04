package com.alumnect.alumnect_backend.dto.response.payment;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi thông tin tạo phiên thanh toán gói Mentor PayOS thành công (UC93).
 * Chứa đầy đủ thông tin VietQR, link thanh toán PayOS và dữ liệu đối soát chuyển khoản.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorPaymentCheckoutResponse {

    /** ID bản ghi giao dịch trong CSDL */
    @Schema(description = "ID giao dịch nội bộ", example = "101")
    private Long transactionId;

    /** Mã đơn hàng độc nhất giao tiếp với PayOS và VietQR */
    @Schema(description = "Mã đơn hàng PayOS", example = "1727800000000")
    private Long orderCode;

    /** Số tiền thanh toán (VND) */
    @Schema(description = "Số tiền thanh toán snapshot từ DB", example = "250000.00")
    private BigDecimal amount;

    /** ID gói dịch vụ Mentor được mua */
    @Schema(description = "ID gói dịch vụ Mentor", example = "2")
    private Long packageId;

    /** Tên gói dịch vụ Mentor */
    @Schema(description = "Tên gói dịch vụ", example = "Gói Phổ Biến 3 Tháng")
    private String packageName;

    /** Thời hạn sử dụng tính theo tháng */
    @Schema(description = "Thời hạn gói (tháng)", example = "3")
    private Integer durationMonths;

    /** Nội dung chuyển khoản yêu cầu (description) */
    @Schema(description = "Nội dung chuyển khoản PayOS", example = "ALUMNECT MSUB 123456")
    private String description;

    /** Chuỗi VietQR hoặc URL ảnh mã QR PayOS */
    @Schema(description = "Dữ liệu VietQR hoặc URL mã QR", example = "https://img.vietqr.io/image/...")
    private String qrCodeUrl;

    /** Đường dẫn tới trang thanh toán PayOS Checkout trực tiếp */
    @Schema(description = "URL thanh toán PayOS Checkout", example = "https://pay.payos.vn/web/...")
    private String checkoutUrl;

    /** Trạng thái giao dịch thanh toán hiện tại */
    @Schema(description = "Trạng thái thanh toán", example = "PENDING")
    private PaymentStatus paymentStatus;

    /** Thời điểm hết hạn của phiên thanh toán (payment window) */
    @Schema(description = "Thời gian hết hạn phiên thanh toán")
    private Instant paymentExpiresAt;

    /** Số tài khoản ngân hàng thụ hưởng nhận thanh toán */
    @Schema(description = "Số tài khoản nhận tiền", example = "0987654321")
    private String accountNumber;

    /** Tên chủ tài khoản ngân hàng thụ hưởng */
    @Schema(description = "Tên chủ tài khoản", example = "CONG TY ALUMNECT")
    private String accountName;

    /** Mã BIN ngân hàng thụ hưởng */
    @Schema(description = "Mã BIN ngân hàng thụ hưởng", example = "970422")
    private String bin;
}
