package com.alumnect.alumnect_backend.dto.request.mentorship;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Yêu cầu học viên từ chối / đề nghị Mentor điều chỉnh / làm rõ Work Log (UC108).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu học viên đề nghị Mentor làm rõ / điều chỉnh Work Log (UC108)")
public class RejectMentoringWorkLogRequest {

    @Schema(description = "Lý do hoặc yêu cầu điều chỉnh từ học viên", example = "Chưa có file minh chứng kết quả review, nhờ Mentor bổ sung thêm.")
    @Size(max = 2000, message = "Lý do điều chỉnh không vượt quá 2000 ký tự.")
    private String feedback;

    @Schema(description = "Lý do yêu cầu làm rõ (alias của feedback)", example = "Chưa có file minh chứng kết quả review, nhờ Mentor bổ sung thêm.")
    @Size(max = 2000, message = "Lý do điều chỉnh không vượt quá 2000 ký tự.")
    private String reason;

    /**
     * Lấy lý do yêu cầu điều chỉnh (chấp nhận cả reason hoặc feedback).
     */
    public String resolveReason() {
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        if (feedback != null && !feedback.isBlank()) {
            return feedback.trim();
        }
        return "";
    }
}
