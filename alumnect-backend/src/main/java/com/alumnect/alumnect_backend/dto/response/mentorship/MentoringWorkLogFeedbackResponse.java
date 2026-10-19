package com.alumnect.alumnect_backend.dto.response.mentorship;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin phản hồi của học viên cho Work Log (UC108)")
public class MentoringWorkLogFeedbackResponse {

    private Long id;
    private Long workLogId;
    private Long studentId;
    private String studentName;
    private String studentAvatar;
    private String action;
    private String reason;
    private Integer revisionNumber;
    private Instant createdAt;
}
