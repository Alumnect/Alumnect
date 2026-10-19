package com.alumnect.alumnect_backend.dto.response.mentorship;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bản ghi snapshot phiên bản Work Log để kiểm toán (UC108)")
public class MentoringWorkLogRevisionResponse {

    private Long id;
    private Long workLogId;
    private Integer revisionNumber;
    private Long mentorId;
    private String mentorName;
    private LocalDate logDate;
    private String description;
    private String workCompleted;
    private String result;
    private String nextAction;
    private String attachmentsSummary;
    private String studentFeedback;
    private Instant createdAt;
}
