package com.alumnect.alumnect_backend.entity.message;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Entity ánh xạ bảng message_attachments — lưu các tệp đính kèm (ảnh, video, file) của tin nhắn.
 */
@Entity
@Table(name = "message_attachments")
@Getter
@Setter
@ToString(exclude = "message")
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageAttachment {

    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tin nhắn sở hữu tệp đính kèm này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    /** Phân loại đa phương tiện: IMAGE, VIDEO, FILE */
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 10)
    private MediaType mediaType;

    /** Đường dẫn URL công khai của tệp (lưu trữ trên Cloudflare R2 / S3) */
    @Column(nullable = false, length = 500)
    private String url;

    /** Tên gốc của tệp tin khi tải lên */
    @Column(name = "file_name", length = 255)
    private String fileName;

    /** Kích thước tệp tin tính theo bytes */
    @Column(name = "file_size")
    private Long fileSize;

    /** Thời điểm tải tệp đính kèm lên */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
