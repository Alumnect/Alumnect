package com.alumnect.alumnect_backend.entity.verification;

import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng verification_requests — phiếu yêu cầu xác nhận tư cách cựu sinh viên (Alumni).
 * Được tạo khi Alumni đăng ký và xác nhận email. Admin sẽ xét duyệt và cập nhật trạng thái.
 */
@Entity
@Table(name = "verification_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationRequest {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng (Alumni) gửi yêu cầu xác nhận này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Năm tốt nghiệp của cựu sinh viên */
    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    /** Chuyên ngành đã học (có thể null nếu chuyên ngành bị xóa) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "major_id")
    private Major major;

    /** URL minh chứng xác nhận là cựu sinh viên (VD: link bằng tốt nghiệp, transcript) */
    @Column(name = "proof_url", length = 500)
    private String proofUrl;

    /** Ghi chú bổ sung từ người đăng ký (không bắt buộc) */
    @Column(length = 500)
    private String note;

    /** Trạng thái xét duyệt: PENDING → APPROVED / REJECTED */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus status;

    /** Admin đã xét duyệt phiếu này (null nếu chưa duyệt) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /** Nhận xét của Admin khi duyệt hoặc từ chối hồ sơ */
    @Column(name = "review_note", length = 500)
    private String reviewNote;

    /** Thời điểm Admin thực hiện xét duyệt (null nếu chưa duyệt) */
    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    /** Thời điểm Alumni gửi phiếu yêu cầu, không thể cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động gán trạng thái PENDING và thời gian tạo khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (status == null) {
            status = VerificationStatus.PENDING;
        }
    }
}

