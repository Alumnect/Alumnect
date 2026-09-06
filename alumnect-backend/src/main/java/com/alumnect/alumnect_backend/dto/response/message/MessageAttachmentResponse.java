package com.alumnect.alumnect_backend.dto.response.message;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * DTO phản hồi thông tin tệp đính kèm trong tin nhắn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageAttachmentResponse {

    /** Mã tệp đính kèm */
    private Long id;

    /** Loại phương tiện: IMAGE, VIDEO, FILE */
    private MediaType mediaType;

    /** Đường dẫn URL công khai */
    private String url;

    /** Tên gốc của tệp tin */
    private String fileName;

    /** Dung lượng tính theo bytes */
    private Long fileSize;

    /** Thời điểm tải lên */
    private Instant createdAt;
}
