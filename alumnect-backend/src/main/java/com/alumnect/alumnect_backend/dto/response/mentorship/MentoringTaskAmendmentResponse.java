package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phản hồi chi tiết Task Amendment Ticket (UC109, mục 5.8).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskAmendmentResponse {

    private Long id;
    private Long taskId;
    private Long conversationId;
    private Integer version;

    /** Người tạo */
    private Long createdById;
    private String createdByName;
    private String createdByAvatar;
    private String createdByRole;

    /** Người nhận */
    private Long recipientId;
    private String recipientName;
    private String recipientAvatar;

    /** Nội dung điều chỉnh */
    private String previousScope;
    private String newScope;
    private String previousExpectedResult;
    private String newExpectedResult;
    private BigDecimal additionalAmount;
    private Instant previousDeadline;
    private Instant newDeadline;
    private String reason;

    /** Trạng thái: PENDING, AWAITING_TOPUP, APPLIED, REJECTED, SUPERSEDED, CANCELLED */
    private MentoringAmendmentStatus status;

    /** Phản hồi */
    private Long respondedById;
    private String respondedByName;
    private Instant respondedAt;

    private Instant createdAt;
    private Instant updatedAt;

    /** Quyền thao tác */
    private Boolean canConfirm;
    private Boolean canReject;
    private Boolean canTopUp; // Student có thể thanh toán top-up nếu status == AWAITING_TOPUP
    /** Người tạo (Mentor) được hủy đề xuất đang chờ phản hồi hoặc chờ thanh toán */
    private Boolean canCancel;
    /** Học viên được từ chối thanh toán bổ sung (đề xuất chuyển REJECTED) */
    private Boolean canDeclineTopUp;
}
