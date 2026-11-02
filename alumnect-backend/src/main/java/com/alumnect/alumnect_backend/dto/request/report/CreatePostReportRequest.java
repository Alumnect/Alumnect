package com.alumnect.alumnect_backend.dto.request.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Dữ liệu thành viên gửi khi báo cáo một bài viết vi phạm. */
@Data
public class CreatePostReportRequest {

    @NotBlank(message = "Vui lòng chọn lý do báo cáo")
    private String reason;

    @Size(max = 500, message = "Mô tả báo cáo không được vượt quá 500 ký tự")
    private String description;

}
