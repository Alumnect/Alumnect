package com.alumnect.alumnect_backend.dto.response.verification;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO phản hồi trạng thái yêu cầu xác minh / nâng cấp Cựu sinh viên của người dùng hiện tại (UC08).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationStatusResponseDto {

    /** ID của phiếu yêu cầu xác minh gần nhất (null nếu chưa từng gửi yêu cầu) */
    private Long id;

    /** ID của tài khoản người dùng */
    private Long userId;

    /** Vai trò hiện tại của người dùng (STUDENT, ALUMNI, ADMIN) */
    private String currentRole;

    /** Cờ đánh dấu tài khoản đã được xác minh chính thức hay chưa */
    @JsonProperty("isAccountVerified")
    private boolean isAccountVerified;

    /** Cờ đánh dấu người dùng đã từng gửi phiếu yêu cầu xác minh hay chưa */
    private boolean hasSubmitted;

    /** Trạng thái xét duyệt hiện tại (NONE, PENDING, APPROVED, REJECTED) */
    private String status;

    /** Đường dẫn tài liệu minh chứng tốt nghiệp đã nộp */
    private String proofUrl;

    /** Năm tốt nghiệp (từ hồ sơ cá nhân của người dùng) */
    private Integer graduationYear;

    /** ID chuyên ngành học */
    private Long majorId;

    /** Mã chuyên ngành (VD: SE, AI, IB) */
    private String majorCode;

    /** Tên chuyên ngành học */
    private String majorName;

    /** Lý do từ chối hoặc ghi chú phản hồi từ Quản trị viên (nếu có) */
    private String reviewNote;

    /** Thời điểm Quản trị viên xét duyệt phiếu yêu cầu */
    private Instant reviewedAt;

    /** Thời điểm người dùng gửi phiếu yêu cầu */
    private Instant createdAt;
}

