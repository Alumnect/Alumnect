package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO chứa thông tin phản hồi đăng ký / chọn gói Mentor (UC92).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorSubscriptionResponse {

    /** ID của bản ghi đăng ký gói */
    private Long id;

    /** ID của hồ sơ Mentor */
    private Long mentorProfileId;

    /** ID của gói Mentor được chọn */
    private Long packageId;

    /** Mã gói Mentor được chọn */
    private String packageCode;

    /** Tên gói Mentor được chọn */
    private String packageName;

    /** Thời hạn gói tính theo tháng */
    private Integer durationMonths;

    /** Giá tại thời điểm chọn / giao dịch (VND) */
    private BigDecimal priceAtPurchase;

    /** Trạng thái đăng ký: PENDING_PAYMENT, PAID, CANCELLED, EXPIRED */
    private MentorSubscriptionStatus status;

    /** Thời điểm bắt đầu hiệu lực gói (nếu có) */
    private Instant startDate;

    /** Thời điểm hết hạn gói (nếu có) */
    private Instant endDate;

    /** Thời điểm chọn gói */
    private Instant createdAt;

    /** Bước xử lý tiếp theo (ví dụ: "UC93_PAYMENT") */
    private String nextStep;
}
