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

    /** ID Mentoring Request gốc sinh ra Deal và Task */
    private Long requestId;

    /** Tiêu đề Mentoring Request gốc */
    private String requestTitle;

    /** ID Chat for Task tiếp tục được dùng trong suốt quá trình thực hiện Task */
    private Long conversationId;

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

    /** Giai đoạn hiển thị trên UI: PREPARATION, IN_PROGRESS, ENDING */
    private String uiStage;

    /** Phần trăm tiến độ theo dữ liệu thật (0 - 100%) */
    private Integer progressPercentage;

    /** Tổng số Work Log */
    private Long totalWorkLogs;

    /** Số Work Log đang chờ xác nhận */
    private Long pendingWorkLogs;

    /** Số Work Log đã xác nhận */
    private Long confirmedWorkLogs;

    /** Trạng thái thanh toán của Deal liên quan */
    private String paymentStatus;

    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
