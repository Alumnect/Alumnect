package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

/**
 * Payload yêu cầu nộp kết quả nghiệm thu Task từ Mentor (UC110).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitTaskCompletionRequest {

    /** Mô tả tóm tắt kết quả hoàn thành nhiệm vụ */
    @NotBlank(message = "Mô tả kết quả cuối cùng không được để trống")
    @Size(max = 3000, message = "Mô tả kết quả cuối cùng không vượt quá 3000 ký tự")
    private String finalSummary;

    /** Nội dung bàn giao, ghi chú sản phẩm hoặc đường dẫn deliverables */
    @Size(max = 2000, message = "Nội dung bàn giao không vượt quá 2000 ký tự")
    private String deliverables;

    /** Danh sách đường dẫn tệp/ảnh tài liệu đính kèm minh chứng */
    private List<String> attachmentUrls;
}
