package com.alumnect.alumnect_backend.dto.request.mentorship;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận dữ liệu phản hồi (chấp nhận hoặc từ chối) yêu cầu Mentoring từ Mentor (UC103).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO gửi kèm khi Mentor phản hồi (chấp nhận/từ chối) yêu cầu Mentoring")
public class RespondMentoringRequestRequest {

    /** Lời nhắn hoặc lý do phản hồi gửi tới sinh viên (tùy chọn, tối đa 500 ký tự) */
    @Size(max = 500, message = "Lời nhắn phản hồi không được vượt quá 500 ký tự")
    @Schema(description = "Lời nhắn trao đổi hoặc lý do từ chối gửi tới sinh viên", example = "Chào bạn, mình rất sẵn lòng hỗ trợ trao đổi về chủ đề này.")
    private String responseNote;
}
