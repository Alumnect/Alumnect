package com.alumnect.alumnect_backend.dto.response.verification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * DTO chứa thông tin chi tiết phiếu yêu cầu xác minh cựu sinh viên phục vụ màn hình duyệt của Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminVerificationRequestDto {

    /** Khóa chính của phiếu xác minh */
    private Long id;

    /** Khóa chính của người dùng (Alumni) gửi yêu cầu */
    private Long userId;

    /** Email của người dùng */
    private String email;

    /** Họ và tên đầy đủ của cựu sinh viên */
    private String fullName;

    /** Ảnh đại diện của cựu sinh viên */
    private String avatarUrl;

    /** Năm tốt nghiệp */
    private Integer graduationYear;

    /** Mã chuyên ngành (VD: SE) */
    private String majorCode;

    /** Tên chuyên ngành học */
    private String majorName;

    /** URL tài liệu ảnh minh chứng (VD: bằng tốt nghiệp, học bạ...) */
    private String proofUrl;

    /** Ghi chú bổ sung từ cựu sinh viên */
    private String note;

    /** Trạng thái duyệt hiện tại (PENDING, APPROVED, REJECTED) */
    private String status;

    /** Thời điểm gửi phiếu xác minh */
    private Instant createdAt;

    /** Họ tên Admin đã duyệt phiếu này (nếu có) */
    private String reviewedBy;

    /** Ghi chú phê duyệt hoặc lý do từ chối từ Admin */
    private String reviewNote;

    /** Thời điểm Admin duyệt phiếu */
    private Instant reviewedAt;
}
