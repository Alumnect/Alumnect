package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO phản hồi kết quả chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (Mentoring Terms Accept).
 * Phản hồi này mang tính idempotent: dù người dùng gọi một hay nhiều lần thì kết quả trả về đều đồng nhất.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringTermsAcceptResponse {

    /** Phiên bản điều khoản đã chấp nhận */
    private String acceptedVersion;

    /** Trạng thái chấp nhận (luôn là true sau khi xử lý thành công) */
    private boolean accepted;

    /** Thời điểm người dùng chấp nhận điều khoản */
    private Instant acceptedAt;
}
