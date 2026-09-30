package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO phản hồi trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (Mentoring Terms Status).
 * Cung cấp thông tin phiên bản hiện tại và trạng thái người dùng đã chấp nhận phiên bản đó hay chưa.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringTermsStatusResponse {

    /** Phiên bản điều khoản hiện tại đang áp dụng trên hệ thống */
    private String currentVersion;

    /** Trạng thái người dùng hiện tại đã chấp nhận phiên bản này hay chưa */
    private boolean accepted;

    /** Thời điểm người dùng chấp nhận điều khoản (null nếu chưa chấp nhận) */
    private Instant acceptedAt;
}
