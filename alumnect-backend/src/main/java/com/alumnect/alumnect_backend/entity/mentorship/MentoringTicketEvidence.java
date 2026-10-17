package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể lưu trữ tài liệu / bằng chứng khiếu nại đính kèm Ticket (UC112 & UC113).
 */
@Entity
@Table(name = "mentoring_ticket_evidences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTicketEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ticket liên kết */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private MentoringDisputeTicket ticket;

    /** Người tải lên bằng chứng (Student hoặc Mentor) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    /** Tiêu đề bằng chứng */
    @Column(name = "title", length = 255)
    private String title;

    /** Mô tả chi tiết bằng chứng */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Đường dẫn tệp đính kèm (S3 / CDN public URL) */
    @Column(name = "file_url", length = 1000, nullable = false)
    private String fileUrl;

    /** Tên gốc của tệp */
    @Column(name = "file_name", length = 255)
    private String fileName;

    /** Dung lượng tệp tính bằng byte */
    @Column(name = "file_size")
    private Long fileSize;

    /** Loại tệp MIME Type (image/png, application/pdf, ...) */
    @Column(name = "file_type", length = 50)
    private String fileType;

    /** Thời điểm tải lên */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
