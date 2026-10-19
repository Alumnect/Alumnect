package com.alumnect.alumnect_backend.dto.request.mentorship;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Yêu cầu học viên xác nhận nghiệm thu Work Log (UC108).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu học viên xác nhận nghiệm thu Work Log (UC108)")
public class ConfirmMentoringWorkLogRequest {

    @Schema(description = "Nhận xét, đánh giá của học viên khi nghiệm thu (tùy chọn)", example = "Mentor hướng dẫn rất chi tiết và đúng hạn.")
    @Size(max = 2000, message = "Nhận xét nghiệm thu không được vượt quá 2000 ký tự.")
    private String feedback;
}
