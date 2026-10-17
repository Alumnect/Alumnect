package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phản hồi chi tiết đề xuất dừng Task và phân chia tiền (UC109).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskSettlementProposalResponse {

    private Long id;
    private Long taskId;
    private Long conversationId;

    /** Người tạo */
    private Long createdById;
    private String createdByName;
    private String createdByAvatar;
    private String createdByRole;

    /** Người nhận */
    private Long recipientId;
    private String recipientName;
    private String recipientAvatar;

    /** Phương án phân chia tiền */
    private BigDecimal mentorAmount;
    private BigDecimal studentRefund;
    private BigDecimal totalAmount;
    private String reason;

    /** Trạng thái: PENDING, ACCEPTED, REJECTED, SUPERSEDED */
    private MentoringSettlementProposalStatus status;

    /** Phản hồi */
    private Long respondedById;
    private String respondedByName;
    private Instant respondedAt;

    private Instant createdAt;
    private Instant updatedAt;

    /** Quyền thao tác */
    private Boolean canAccept;
    private Boolean canReject;
    /** Người tạo được hủy đề xuất đang chờ */
    private Boolean canCancel;
    /** Học viên cần khai báo tài khoản nhận hoàn tiền trước khi đồng ý đề xuất có hoàn tiền */
    private Boolean refundAccountRequired;
}
