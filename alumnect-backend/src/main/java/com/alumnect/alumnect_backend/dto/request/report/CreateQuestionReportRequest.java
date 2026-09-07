package com.alumnect.alumnect_backend.dto.request.report;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO gửi từ phía người dùng khi báo cáo một câu hỏi vi phạm trên diễn đàn (UC78).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionReportRequest {

    /** Lý do báo cáo vi phạm (Bắt buộc) */
    @NotNull(message = "Lý do báo cáo không được để trống")
    private ReportReason reason;

    /** Mô tả chi tiết lý do vi phạm (Tùy chọn, tối đa 500 ký tự) */
    @Size(max = 500, message = "Mô tả lý do báo cáo không được vượt quá 500 ký tự")
    private String description;
}
