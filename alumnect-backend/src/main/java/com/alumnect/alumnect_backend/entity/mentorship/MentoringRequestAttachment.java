package com.alumnect.alumnect_backend.entity.mentorship;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Entity ánh xạ bảng mentoring_request_attachments — lưu tệp tin đính kèm của yêu cầu Mentoring (UC100).
 * Mỗi tệp đính kèm phải có dung lượng nhỏ hơn 10 MB theo giới hạn chính sách hệ thống (BR-07).
 */
@Entity
@Table(name = "mentoring_request_attachments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringRequestAttachment {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Yêu cầu Mentoring chứa tệp đính kèm này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private MentoringRequest request;

    /** Tên gốc của tệp tin khi người dùng tải lên */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /** Đường dẫn truy cập công khai của tệp tin trên Cloud Storage (Cloudflare R2) */
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    /** Kích thước tệp tính theo bytes (bắt buộc < 10,485,760 bytes) */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** Định dạng MIME type của tệp tin (ví dụ: application/pdf, image/png...) */
    @Column(name = "file_type", length = 100)
    private String fileType;

    /** Thời điểm tải lên và đính kèm tệp */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
