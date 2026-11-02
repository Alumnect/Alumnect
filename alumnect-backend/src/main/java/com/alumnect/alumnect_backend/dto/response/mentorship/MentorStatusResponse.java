package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO tổng hợp trạng thái hồ sơ Mentor và gói duy trì dịch vụ Subscription (UC94).
 * Cung cấp đầy đủ thông tin cho màn hình Mentor Status Dashboard nhằm hướng dẫn người dùng
 * thực hiện các hành động tiếp theo trong quy trình cố vấn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorStatusResponse {

    /** Trạng thái tổng thể của Mentor: INCOMPLETE, PAYMENT_PENDING, ACTIVE, EXPIRED */
    private MentorStatus mentorStatus;

    /** Mentor đang ở trạng thái hoạt động chính thức (mentorStatus == ACTIVE) */
    private boolean active;

    /** Thông điệp giải thích trạng thái nghiệp vụ bằng Tiếng Việt */
    private String statusMessage;

    /** Đã khởi tạo hồ sơ Mentor trong hệ thống hay chưa */
    private boolean hasMentorProfile;

    /** Hồ sơ thông tin cá nhân & nghề nghiệp bắt buộc đã hoàn tất 100% hay chưa (UC91) */
    private boolean profileComplete;

    /** Danh sách các trường dữ liệu hồ sơ cá nhân/nghề nghiệp còn thiếu nếu chưa hoàn thiện */
    private List<String> missingProfileFields;

    /** Đã tải lên tệp CV ứng tuyển hay chưa */
    private boolean hasCv;

    /** Trạng thái CV dưới dạng chuỗi (UPLOADED hoặc MISSING) */
    public String getCvStatus() {
        return hasCv ? "UPLOADED" : "MISSING";
    }

    /** Tên tệp tin CV rút gọn an toàn phục vụ hiển thị trên giao diện */
    private String cvFileName;

    /** Đã khai báo đầy đủ thông tin tài khoản ngân hàng nhận chi trả hay chưa */
    private boolean bankInformationComplete;

    /** Trạng thái thông tin ngân hàng dưới dạng chuỗi (CONFIGURED hoặc INCOMPLETE) */
    public String getBankInformationStatus() {
        return bankInformationComplete ? "CONFIGURED" : "INCOMPLETE";
    }

    /** Tên ngân hàng thụ hưởng (ví dụ: Vietcombank, MB Bank, Techcombank) */
    private String bankName;

    /** Số tài khoản ngân hàng đã được làm mờ (Masked data: ví dụ **** **** 1234) bảo vệ PII */
    private String maskedAccountNumber;

    /** Tên chủ tài khoản thụ hưởng */
    private String bankAccountHolder;

    /** Đã chấp nhận Điều khoản Hướng dẫn & Hỗ trợ hiện hành hay chưa (UC90) */
    private boolean termsAccepted;

    /** Phiên bản điều khoản hiện hành trên hệ thống (ví dụ: 1.0) */
    private String currentTermsVersion;

    /** Thời điểm người dùng chấp nhận điều khoản */
    private Instant termsAcceptedAt;

    /** Đã từng đăng ký gói dịch vụ Mentor hay chưa */
    private boolean hasSubscription;

    /** ID của bản ghi đăng ký gói hiện tại */
    private Long subscriptionId;

    /** Trạng thái của gói subscription hiện tại (PENDING_PAYMENT, ACTIVE, PAID, EXPIRED, CANCELLED) */
    private MentorSubscriptionStatus subscriptionStatus;

    /** ID gói dịch vụ Mentor được chọn */
    private Long packageId;

    /** Mã định danh gói (ví dụ: 1 Tháng, 3 Tháng, 6 Tháng) */
    private String packageCode;

    /** Tên gói dịch vụ Mentor (ví dụ: Gói Tiêu Chuẩn 1 Tháng) */
    private String packageName;

    /** Giá mua gói (VND) */
    private BigDecimal priceAtPurchase;

    /** Thời hạn sử dụng gói tính theo tháng */
    private Integer durationMonths;

    /** Thời điểm bắt đầu hiệu lực gói */
    private Instant startDate;

    /** Alias startedAt tương thích quy chuẩn báo cáo API */
    @JsonProperty("startedAt")
    public Instant getStartedAt() {
        return startDate;
    }

    /** Thời điểm hết hạn gói dịch vụ */
    private Instant endDate;

    /** Alias expiredAt tương thích quy chuẩn báo cáo API */
    @JsonProperty("expiredAt")
    public Instant getExpiredAt() {
        return endDate;
    }

    /** Số ngày sử dụng còn lại của gói dịch vụ Mentor (0 nếu đã hết hạn hoặc chưa kích hoạt) */
    private Long remainingDays;

    /** Mã đơn hàng PayOS đang chờ thanh toán nếu có (phục vụ tiếp tục thanh toán UC93) */
    private Long pendingPaymentOrderCode;

    /** Danh sách các điều kiện tiên quyết còn thiếu để trở thành Mentor ACTIVE */
    private List<String> missingRequirements;

    /** Mã hành động tiếp theo khuyến nghị cho người dùng */
    private String nextAction;

    /** Đường dẫn điều hướng Frontend tương ứng với hành động tiếp theo */
    private String actionUrl;
}
