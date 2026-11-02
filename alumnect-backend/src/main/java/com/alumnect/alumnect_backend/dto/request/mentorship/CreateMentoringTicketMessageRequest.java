package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO yêu cầu gửi tin nhắn / đề xuất hòa giải trong Ticket tranh chấp (UC119).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMentoringTicketMessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 5000, message = "Nội dung tin nhắn không vượt quá 5000 ký tự")
    private String content;

    /** Loại tin nhắn: TEXT (mặc định), MEDIATION_OFFER, DEADLINE_REQUEST */
    @Builder.Default
    private String messageType = "TEXT";

    /** Danh sách tệp đính kèm / bằng chứng bổ sung */
    @Valid
    private List<TicketEvidenceRequest> attachments;

    /** Đề xuất thù lao Mentor (nếu là đề xuất hòa giải MEDIATION_OFFER) */
    @DecimalMin(value = "0.0", message = "Thù lao đề xuất của Mentor phải lớn hơn hoặc bằng 0")
    private BigDecimal proposedMentorAmount;

    /** Đề xuất hoàn tiền Student (nếu là đề xuất hòa giải MEDIATION_OFFER) */
    @DecimalMin(value = "0.0", message = "Số tiền hoàn đề xuất cho Student phải lớn hơn hoặc bằng 0")
    private BigDecimal proposedStudentRefund;

    /** Hạn chót phản hồi yêu cầu (nếu Admin yêu cầu bổ sung DEADLINE_REQUEST) */
    private Instant deadline;
}
