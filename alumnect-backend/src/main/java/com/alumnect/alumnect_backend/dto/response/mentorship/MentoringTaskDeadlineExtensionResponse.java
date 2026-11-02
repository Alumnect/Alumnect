package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import lombok.*;

import java.time.Instant;

/**
 * Phản hồi chi tiết Deadline Extension Ticket (UC109).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskDeadlineExtensionResponse {

    private Long id;
    private Long taskId;
    private Long conversationId;

    /** Người tạo đề xuất */
    private Long createdById;
    private String createdByName;
    private String createdByAvatar;
    private String createdByRole; // 'Mentor' hoặc 'Student'

    /** Người nhận đề xuất */
    private Long recipientId;
    private String recipientName;
    private String recipientAvatar;

    /** Deadline cũ và mới */
    private Instant currentDeadline;
    private Instant proposedDeadline;
    private String reason;

    /** Trạng thái Ticket: PENDING, CONFIRMED, REJECTED, SUPERSEDED */
    private MentoringExtensionStatus status;

    /** Phản hồi */
    private Long respondedById;
    private String respondedByName;
    private Instant respondedAt;
    private String responseNote;

    private Instant createdAt;
    private Instant updatedAt;

    /** Quyền thao tác của user hiện tại với Ticket này */
    private Boolean canConfirm;
    private Boolean canReject;
    /** Người tạo được hủy đề xuất đang chờ */
    private Boolean canCancel;
}
