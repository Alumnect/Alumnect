package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho một tệp tin đính kèm trong yêu cầu Mentoring (UC100).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringAttachmentRequest {

    /** Tên gốc của tệp tin */
    @NotBlank(message = "Tên tệp tin không được để trống")
    @Size(max = 255, message = "Tên tệp tin không được vượt quá 255 ký tự")
    private String fileName;

    /** Đường dẫn tệp tin trên kho lưu trữ đám mây (Cloudflare R2) */
    @NotBlank(message = "Đường dẫn tệp tin không được để trống")
    @Size(max = 500, message = "Đường dẫn tệp tin không được vượt quá 500 ký tự")
    private String fileUrl;

    /** Dung lượng tệp tin (bytes) — Giới hạn hệ thống nhỏ hơn 10 MB (10,485,760 bytes) */
    @NotNull(message = "Kích thước tệp tin không được để trống")
    @Positive(message = "Kích thước tệp tin phải lớn hơn 0")
    @Max(value = 10485759L, message = "Kích thước tệp tin phải nhỏ hơn 10 MB")
    private Long fileSize;

    /** Định dạng MIME type của tệp tin */
    @Size(max = 100, message = "Định dạng tệp tin không được vượt quá 100 ký tự")
    private String fileType;
}
