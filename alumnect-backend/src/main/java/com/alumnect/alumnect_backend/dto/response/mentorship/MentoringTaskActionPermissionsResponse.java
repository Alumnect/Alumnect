package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

/**
 * DTO chứa quyền thao tác (Available Actions) dựa trên vai trò, trạng thái Task và nghiệp vụ (UC106 & UC107).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskActionPermissionsResponse {

    /** Cho phép Mentor thêm Work Log mới */
    private Boolean canAddWorkLog;

    /** Cho phép Mentor chỉnh sửa Work Log đang ở trạng thái PENDING_CONFIRMATION */
    private Boolean canEditWorkLog;

    /** Cho phép Student xác nhận nghiệm thu Work Log (dành cho UC108 tương lai) */
    private Boolean canConfirmWorkLog;

    /** Task đang ở chế độ chỉ đọc (COMPLETED, CANCELLED, hoặc DISPUTED) */
    private Boolean isReadOnly;

    /** Người dùng hiện tại có phải là Student của Task này hay không */
    private Boolean isStudent;

    /** Người dùng hiện tại có phải là Mentor của Task này hay không */
    private Boolean isMentor;

    /** Task có đang bị khiếu nại/tranh chấp (DISPUTED) hay không */
    private Boolean isDisputed;

    /** Cho phép đề xuất gia hạn deadline (UC109) */
    private Boolean canRequestExtension;

    /** Cho phép đề xuất điều chỉnh Task / bổ sung tiền (UC109) */
    private Boolean canRequestAmendment;

    /** Cho phép đề xuất dừng Task và phân chia tiền (UC109) */
    private Boolean canProposeSettlement;

    /** Cho phép Mentor nộp kết quả hoàn thành nhiệm vụ (UC110) */
    private Boolean canSubmitCompletion;

    /** Cho phép Student xác nhận/từ chối nghiệm thu hoàn thành nhiệm vụ (UC110) */
    private Boolean canConfirmCompletion;

    /** Cho phép gửi Settlement Ticket đã thỏa thuận lên Admin (UC111) */
    private Boolean canSubmitSettlementTicket;

    /** Cho phép tạo Dispute Ticket yêu cầu Admin can thiệp giải quyết tranh chấp (UC112) */
    private Boolean canCreateDisputeTicket;
}
