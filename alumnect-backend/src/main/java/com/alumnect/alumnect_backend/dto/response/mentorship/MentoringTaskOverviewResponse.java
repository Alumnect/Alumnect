package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO tổng quan trạng thái, giai đoạn và tiến độ của Mentoring Task (UC106).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskOverviewResponse {

    /** ID của Task */
    private Long id;

    /** Tiêu đề Task */
    private String taskTitle;

    /** Phạm vi công việc */
    private String taskScope;

    /** Mức giá thỏa thuận (VND) */
    private BigDecimal agreedPrice;

    /** Trạng thái nghiệp vụ thực tế ở backend (PREPARATION, IN_PROGRESS, SUBMITTED, COMPLETED, CANCELLED, DISPUTED) */
    private MentoringTaskStatus status;

    /** Giai đoạn hiển thị cấp cao trên UI: PREPARATION, IN_PROGRESS, ENDING */
    private String uiStage;

    /** Phần trăm tiến độ ước lượng theo dữ liệu thật (0 - 100%) */
    private Integer progressPercentage;

    /** Hình thức làm việc */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia */
    private MentoringParticipationType participationType;

    /** Phân loại công việc */
    private MentoringTaskType taskType;

    /** Thời điểm bắt đầu kích hoạt */
    private Instant startedAt;

    /** Hạn chót hoàn thành */
    private Instant deadline;

    /** Thời điểm hoàn thành nghiệm thu (nếu có) */
    private Instant completedAt;

    /** Số ngày còn lại đến hạn (âm nếu đã quá hạn) */
    private Long daysRemaining;

    /** Task đang thực hiện nhưng đã quá deadline */
    private Boolean overdue;

    /** Số tiền đang giữ trong quỹ ký quỹ của Task (dùng khi thỏa thuận dừng Task) */
    private java.math.BigDecimal escrowBalance;

    /** Cờ cảnh báo quá hạn hoàn thành */
    private Boolean isOverdue;

    /** Tổng số Work Log đã ghi nhận */
    private Long totalWorkLogs;

    /** Số Work Log đã được học viên xác nhận */
    private Long confirmedWorkLogs;

    /** Số Work Log đang chờ xác nhận */
    private Long pendingWorkLogs;
}
