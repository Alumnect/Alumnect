package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO chứa thông tin phản hồi của một gói dịch vụ Mentor (UC92).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorPackageResponse {

    /** ID gói dịch vụ */
    private Long id;

    /** Mã định danh gói (ví dụ: MENTOR_1M, MENTOR_3M, MENTOR_6M) */
    private String code;

    /** Tên gói dịch vụ */
    private String name;

    /** Mô tả chi tiết quyền lợi */
    private String description;

    /** Thời hạn sử dụng tính theo tháng (1, 3, 6) */
    private Integer durationMonths;

    /** Giá niêm yết (VND) */
    private BigDecimal price;

    /** Trạng thái kinh doanh của gói: ACTIVE, INACTIVE */
    private MentorPackageStatus status;

    /** Thời điểm khởi tạo */
    private Instant createdAt;
}
