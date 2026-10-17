package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.TicketEvidenceRequest;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO phản hồi tin nhắn trao đổi trong Ticket tranh chấp (UC119).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTicketMessageResponse {

    private Long id;
    private Long ticketId;

    /** Thông tin người gửi */
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String senderRole; // 'ADMIN', 'STUDENT', 'MENTOR'

    /** Phân loại tin nhắn */
    private String messageType; // 'TEXT', 'MEDIATION_OFFER', 'DEADLINE_REQUEST'
    private String content;

    /** Danh sách tài liệu đính kèm */
    private List<TicketEvidenceRequest> attachments;

    /** Số tiền hòa giải đề xuất (nếu có) */
    private BigDecimal proposedMentorAmount;
    private BigDecimal proposedStudentRefund;

    /** Hạn chót phản hồi (nếu có) */
    private Instant deadline;

    /** Thời điểm gửi tin nhắn */
    private Instant createdAt;
}
