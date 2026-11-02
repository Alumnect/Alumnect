package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể lưu trữ tệp đính kèm và tài liệu minh chứng cho Work Log (UC107).
 */
@Entity
@Table(name = "mentoring_work_log_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringWorkLogAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nhật ký công việc mà tệp này đính kèm vào */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_log_id", nullable = false)
    private MentoringWorkLog workLog;

    /** Đường dẫn tệp công khai (được upload lên Cloudflare R2 / S3 qua Presigned URL) */
    @Column(name = "file_url", length = 500, nullable = false)
    private String fileUrl;

    /** Tên gốc của tệp tin */
    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    /** Kích thước tệp tin (bytes) */
    @Column(name = "file_size")
    private Long fileSize;

    /** Phân loại phương tiện (IMAGE, VIDEO, FILE) */
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 20, nullable = false)
    @Builder.Default
    private MediaType mediaType = MediaType.FILE;

    /** Thời điểm tải lên */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
