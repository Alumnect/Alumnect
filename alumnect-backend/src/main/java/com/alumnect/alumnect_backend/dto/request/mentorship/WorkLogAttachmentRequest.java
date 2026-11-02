package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO yêu cầu đính kèm tài liệu minh chứng trong nhật ký công việc (UC107).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkLogAttachmentRequest {

    /** Đường dẫn tệp công khai (đã upload qua Presigned URL) */
    @NotBlank(message = "Đường dẫn tệp đính kèm không được để trống.")
    @Size(max = 500, message = "Đường dẫn tệp đính kèm không vượt quá 500 ký tự.")
    private String fileUrl;

    /** Tên gốc của tệp tin */
    @NotBlank(message = "Tên tệp tin không được để trống.")
    @Size(max = 255, message = "Tên tệp tin không vượt quá 255 ký tự.")
    private String fileName;

    /** Dung lượng tệp tin (bytes) */
    private Long fileSize;

    /** Loại phương tiện (IMAGE, VIDEO, FILE) */
    @Builder.Default
    private MediaType mediaType = MediaType.FILE;
}
