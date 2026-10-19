package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Payload phản hồi nghiệm thu kết quả Task từ Student (UC110).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespondTaskCompletionRequest {

    /** Chấp nhận (true) hoặc Từ chối/Yêu cầu chỉnh sửa (false) */
    @NotNull(message = "Vui lòng chọn chấp nhận hoặc từ chối kết quả hoàn thành")
    private Boolean accept;

    /** Ghi chú giải thích hoặc lý do yêu cầu chỉnh sửa/bổ sung */
    @Size(max = 1000, message = "Ghi chú phản hồi không vượt quá 1000 ký tự")
    private String feedbackNote;
}
