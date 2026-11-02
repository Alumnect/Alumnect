package com.alumnect.alumnect_backend.dto.request.message;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu đính kèm tệp tin/hình ảnh trong tin nhắn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentRequest {

    /** Phân loại phương tiện (IMAGE, VIDEO, FILE) */
    @Builder.Default
    private MediaType mediaType = MediaType.FILE;

    /** Đường dẫn tệp công khai (đã upload qua Presigned URL lên Cloudflare R2) */
    @NotBlank(message = "Đường dẫn tệp đính kèm không được để trống.")
    @Size(max = 500, message = "Đường dẫn tệp đính kèm không vượt quá 500 ký tự.")
    private String url;

    /** Tên gốc của tệp tin */
    @Size(max = 255, message = "Tên tệp tin không vượt quá 255 ký tự.")
    private String fileName;

    /** Dung lượng tệp tin (bytes) */
    private Long fileSize;
}
