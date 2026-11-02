package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO chứa thông tin tệp tin đính kèm trả về cho Client sau khi lưu (UC100).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringAttachmentResponse {

    /** ID của tệp đính kèm trong cơ sở dữ liệu */
    private Long id;

    /** Tên tệp tin gốc */
    private String fileName;

    /** Đường dẫn truy cập tệp tin công khai */
    private String fileUrl;

    /** Dung lượng tệp tin tính theo bytes */
    private Long fileSize;

    /** Định dạng MIME type của tệp */
    private String fileType;

    /** Thời điểm tải lên */
    private Instant createdAt;
}
