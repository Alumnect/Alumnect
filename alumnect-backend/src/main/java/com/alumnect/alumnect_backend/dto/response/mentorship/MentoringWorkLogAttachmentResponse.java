package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import lombok.*;

import java.time.Instant;

/**
 * Phản hồi chi tiết của tài liệu minh chứng đính kèm Work Log (UC107).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringWorkLogAttachmentResponse {

    /** ID của tệp đính kèm */
    private Long id;

    /** Đường dẫn tệp công khai */
    private String fileUrl;

    /** Tên gốc của tệp tin */
    private String fileName;

    /** Kích thước tệp tin (bytes) */
    private Long fileSize;

    /** Loại phương tiện (IMAGE, VIDEO, FILE) */
    private MediaType mediaType;

    /** Thời điểm tải lên */
    private Instant createdAt;
}
