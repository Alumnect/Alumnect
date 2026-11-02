package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.time.Instant;

/**
 * DTO trả về thông tin bằng chứng tranh chấp (UC112 & UC113).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTicketEvidenceResponse {

    private Long id;
    private Long ticketId;
    private MentoringParticipantResponse uploadedBy;
    private String title;
    private String description;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private Instant createdAt;
}
