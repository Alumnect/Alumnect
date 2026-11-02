package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.time.Instant;

/**
 * DTO mô tả một sự kiện trong lịch sử tiến trình (Task History / Timeline) (UC106).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskHistoryEventResponse {

    /** ID sự kiện hoặc mã định danh duy nhất */
    private String id;

    /** Thời điểm diễn ra sự kiện */
    private Instant timestamp;

    /** Loại sự kiện: TASK_ACTIVATED, WORK_LOG_SUBMITTED, WORK_LOG_UPDATED, WORK_LOG_CONFIRMED, TASK_COMPLETED, TASK_CANCELLED, TASK_DISPUTED */
    private String eventType;

    /** Tiêu đề ngắn gọn của sự kiện */
    private String title;

    /** Chi tiết nội dung sự kiện */
    private String description;

    /** Tên người thực hiện hành động */
    private String actorName;

    /** Vai trò của người thực hiện (STUDENT, MENTOR, SYSTEM) */
    private String actorRole;
}
