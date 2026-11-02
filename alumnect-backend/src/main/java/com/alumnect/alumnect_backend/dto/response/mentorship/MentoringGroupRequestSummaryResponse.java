package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO tóm tắt các Mentoring Request liên kết với một Group.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringGroupRequestSummaryResponse {
    private Long id;
    private String title;
    private MentoringRequestType requestType;
    private MentoringRequestStatus status;
    private Long targetMentorId;
    private String targetMentorName;
    private Long confirmedDealId;
    private Long taskId;
    private Instant createdAt;
}
