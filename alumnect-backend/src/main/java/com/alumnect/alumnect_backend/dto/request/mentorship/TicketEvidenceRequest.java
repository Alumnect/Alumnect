package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO đại diện cho một tệp / liên kết bằng chứng đính kèm khi tạo hoặc bổ sung Evidence (UC112 & UC113).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketEvidenceRequest {

    @Size(max = 255, message = "Tiêu đề bằng chứng không vượt quá 255 ký tự")
    private String title;

    @Size(max = 2000, message = "Mô tả bằng chứng không vượt quá 2000 ký tự")
    private String description;

    @NotBlank(message = "Đường dẫn tệp bằng chứng không được để trống")
    @Size(max = 1000, message = "Đường dẫn tệp không vượt quá 1000 ký tự")
    private String fileUrl;

    @Size(max = 255, message = "Tên tệp không vượt quá 255 ký tự")
    private String fileName;

    private Long fileSize;

    @Size(max = 50, message = "Loại tệp không vượt quá 50 ký tự")
    private String fileType;
}
