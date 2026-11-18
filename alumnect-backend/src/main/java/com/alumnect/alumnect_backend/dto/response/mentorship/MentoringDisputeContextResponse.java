package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO chứa toàn bộ bằng chứng tranh chấp và bối cảnh toàn diện của Task dành cho Quản trị viên (UC118).
 * Bao gồm: Bằng chứng do 2 bên nộp, Deal gốc, Timeline & Lịch sử gia hạn, Confirmed Work Logs,
 * Deliverables cuối cùng và Quỹ tiền Escrow đang tạm giữ.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringDisputeContextResponse {

    /** Thông tin cơ bản của Ticket */
    private MentoringDisputeTicketResponse ticket;

    /** Danh sách toàn bộ bằng chứng tranh chấp (UC112, UC113) */
    private List<MentoringTicketEvidenceResponse> evidences;
    private int studentEvidenceCount;
    private int mentorEvidenceCount;

    /** Bối cảnh Deal ban đầu */
    private Long dealId;
    private BigDecimal dealPrice;
    private Instant dealConfirmedAt;
    private String taskTitle;
    private String taskScope;
    private String expectedResult;

    /** Timeline & Deadline của Task */
    private Instant startedAt;
    private Instant originalDeadline;
    private Instant currentDeadline;
    @com.fasterxml.jackson.annotation.JsonProperty("isOverdue")
    private boolean isOverdue;

    /** Lịch sử các lần gia hạn deadline (UC109) */
    private List<MentoringTaskDeadlineExtensionResponse> extensionHistory;

    /** Danh sách các nhật ký công việc đã được nghiệm thu (UC107, UC108) */
    private List<MentoringWorkLogResponse> confirmedWorkLogs;
    private int totalConfirmedLogs;

    /** Lần nộp nghiệm thu hoàn thành gần nhất (UC110) nếu có */
    private MentoringTaskCompletionResponse latestCompletionSubmission;

    /** Thông tin tài chính tạm giữ (Escrow Fund) */
    private BigDecimal totalEscrowAmount;
}
