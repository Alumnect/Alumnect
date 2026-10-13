package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Phản hồi chi tiết Mentoring Task tổng hợp toàn bộ 10 section nghiệp vụ (UC106 & UC107).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskDetailResponse {

    /** 1. Tổng quan Task */
    private MentoringTaskOverviewResponse overview;

    /** 2. Thông tin Deal đã chốt */
    private MentoringDealSummaryResponse deal;

    /** 3. Thông tin học viên (Student) */
    private MentoringParticipantResponse student;

    /** 3. Thông tin cố vấn (Mentor) */
    private MentoringParticipantResponse mentor;

    /** 4. ID cuộc trò chuyện Chat for Task */
    private Long conversationId;

    /** 5. ID Mentoring Request gốc */
    private Long requestId;

    /** Tiêu đề Mentoring Request gốc */
    private String requestTitle;

    /** 6. Thông tin thanh toán */
    private MentoringPaymentSummaryResponse payment;

    /** 7. Danh sách nhật ký công việc (Work Logs) */
    @Builder.Default
    private List<MentoringWorkLogResponse> workLogs = new ArrayList<>();

    /** 8. Lịch sử tiến trình nhiệm vụ (Task History) */
    @Builder.Default
    private List<MentoringTaskHistoryEventResponse> history = new ArrayList<>();

    /** 9. Quyền hạn và hành động khả dụng (Available Actions) */
    private MentoringTaskActionPermissionsResponse permissions;
}
