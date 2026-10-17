package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể lưu trữ tin nhắn và thảo luận trong Ticket tranh chấp / hòa giải (UC119).
 * Tạo kênh trao đổi có audit giữa Student, Mentor và Admin.
 */
@Entity
@Table(name = "mentoring_ticket_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTicketMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ticket liên kết */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private MentoringDisputeTicket ticket;

    /** Người gửi tin nhắn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /** Vai trò của người gửi: 'ADMIN', 'STUDENT', 'MENTOR' */
    @Column(name = "sender_role", length = 30, nullable = false)
    private String senderRole;

    /** Loại tin nhắn: 'TEXT', 'MEDIATION_OFFER', 'DEADLINE_REQUEST' */
    @Column(name = "message_type", length = 30, nullable = false)
    private String messageType;

    /** Nội dung tin nhắn */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    /** Chuỗi JSON danh sách tệp đính kèm */
    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments;

    /** Đề xuất thù lao Mentor (nếu là MEDIATION_OFFER) */
    @Column(name = "proposed_mentor_amount", precision = 15, scale = 2)
    private BigDecimal proposedMentorAmount;

    /** Đề xuất hoàn tiền Student (nếu là MEDIATION_OFFER) */
    @Column(name = "proposed_student_refund", precision = 15, scale = 2)
    private BigDecimal proposedStudentRefund;

    /** Hạn chót phản hồi Admin yêu cầu (nếu là DEADLINE_REQUEST) */
    @Column(name = "deadline")
    private Instant deadline;

    /** Thời điểm gửi tin */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.messageType == null || this.messageType.isBlank()) {
            this.messageType = "TEXT";
        }
    }
}
