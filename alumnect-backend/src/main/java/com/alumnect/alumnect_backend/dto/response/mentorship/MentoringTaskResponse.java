package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phản hồi chi tiết của Mentoring Task (UC105).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskResponse {

    private Long id;
    private Long dealId;

    private Long studentId;
    private String studentName;
    private String studentAvatar;

    private Long mentorId;
    private String mentorName;
    private String mentorAvatar;

    private String taskTitle;
    private String taskScope;
    private BigDecimal agreedPrice;
    private Instant deadline;

    private MentoringWorkingMode workingMode;
    private MentoringParticipationType participationType;
    private MentoringTaskType taskType;
    private String expectedResult;

    private MentoringTaskStatus status;
    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
