package com.alumnect.alumnect_backend.entity.report;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Bản ghi báo cáo nội dung; UC24 hiện sử dụng loại nội dung POST. */
@Entity
@Table(name = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportReason reason;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Điểm số rủi ro do AI/Profanity engine đánh giá (từ 0.00 đến 1.00). */
    @Column(name = "ai_score", nullable = false)
    @Builder.Default
    private Double aiScore = 0.0;

    /** Lý do hệ thống đánh dấu vi phạm hoặc nhãn phân loại của AI. */
    @Column(name = "ai_flagged_reason", length = 255)
    private String aiFlaggedReason;

    /** Đánh dấu xem bài viết này đã bị hệ thống tự động ẩn do vi phạm nghiêm trọng chưa. */
    @Column(name = "auto_moderated", nullable = false)
    @Builder.Default
    private Boolean autoModerated = false;

    /** Danh sách từ cấm phát hiện được trong nội dung (dạng chuỗi phân cách bởi dấu phẩy). */
    @Column(name = "detected_keywords", columnDefinition = "TEXT")
    private String detectedKeywords;

    /** Người thực hiện kiểm duyệt và giải quyết báo cáo này (Admin). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /** Thời điểm Admin kiểm duyệt và xử lý báo cáo. */
    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    /** Khởi tạo trạng thái chờ để Admin xử lý ở các UC kiểm duyệt tiếp theo. */
    @jakarta.persistence.PrePersist
    protected void onCreate() {
        if (status == null) {
            status = ReportStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (aiScore == null) {
            aiScore = 0.0;
        }
        if (autoModerated == null) {
            autoModerated = false;
        }
    }
}
