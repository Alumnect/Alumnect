package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.util.List;

/**
 * DTO chi tiết toàn diện Sổ quỹ giao dịch, lịch sử gia hạn, điều chỉnh và quyết định phân bổ của Task (UC121 & Mục 5.7).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTaskFundDetailResponse {

    /** Thông tin tóm tắt số liệu quỹ */
    private AdminTaskFundSummaryResponse summary;

    /** Danh sách toàn bộ các giao dịch ghi nhận trong Sổ quỹ Mentoring theo thời gian */
    private List<MentoringPaymentLedgerResponse> ledgers;

    /** Lịch sử yêu cầu gia hạn thời hạn nhiệm vụ (UC109) kèm snapshot deadline */
    private List<MentoringTaskDeadlineExtensionResponse> extensionHistory;

    /** Lịch sử các đề xuất điều chỉnh phạm vi & bổ sung tiền (UC109 Amendment Ticket) */
    private List<MentoringTaskAmendmentResponse> amendmentHistory;

    /** Danh sách các Settlement / Dispute Ticket gắn với Task (UC111, UC112, UC120) */
    private List<MentoringDisputeTicketResponse> disputeTickets;
}
