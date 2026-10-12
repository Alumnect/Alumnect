package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.enums.ProposalSource;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity ánh xạ bảng mentoring_deal_snapshots — Lưu trữ snapshot từng phiên bản của Mentoring Deal (UC104).
 * Cung cấp bằng chứng bất biến về các điều khoản qua từng lần điều chỉnh và phiên bản chốt cuối cùng.
 */
@Entity
@Table(name = "mentoring_deal_snapshots", uniqueConstraints = {
    @UniqueConstraint(name = "uq_deal_snapshots_deal_version", columnNames = {"deal_id", "version"})
})
@Getter
@Setter
@ToString(exclude = {"deal", "modifiedBy"})
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringDealSnapshot {

    /** Khóa chính tự tăng của snapshot */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Thỏa thuận Mentoring Deal chứa snapshot này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false)
    private MentoringDeal deal;

    /** Loại Ticket: DEAL */
    @Column(name = "ticket_type", length = 20, nullable = false)
    @Builder.Default
    private String ticketType = "DEAL";

    /** Nguồn gốc đề xuất: REQUEST_ACCEPTANCE hoặc RENEGOTIATION */
    @Enumerated(EnumType.STRING)
    @Column(name = "proposal_source", length = 30, nullable = false)
    @Builder.Default
    private ProposalSource proposalSource = ProposalSource.RENEGOTIATION;

    /** Số thứ tự phiên bản của snapshot này */
    @Column(name = "version", nullable = false)
    private Integer version;

    /** Phạm vi công việc tại phiên bản snapshot này */
    @Column(name = "task_scope", columnDefinition = "TEXT", nullable = false)
    private String taskScope;

    /** Mức giá thỏa thuận tại phiên bản snapshot này (VND) */
    @Column(name = "agreed_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành tại phiên bản snapshot này */
    @Column(name = "deadline", nullable = false)
    private Instant deadline;

    /** Hình thức làm việc tại phiên bản snapshot này */
    @Enumerated(EnumType.STRING)
    @Column(name = "working_mode", length = 20, nullable = false)
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia tại phiên bản snapshot này */
    @Enumerated(EnumType.STRING)
    @Column(name = "participation_type", length = 20, nullable = false)
    private MentoringParticipationType participationType;

    /** Loại nhiệm vụ tại phiên bản snapshot này */
    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", length = 50, nullable = false)
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng tại phiên bản snapshot này */
    @Column(name = "expected_result", columnDefinition = "TEXT", nullable = false)
    private String expectedResult;

    /** Người thực hiện chỉnh sửa / tạo ra phiên bản snapshot này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modified_by", nullable = false)
    private User modifiedBy;

    /** Ghi chú lý do thay đổi / thông điệp kèm theo đề xuất */
    @Column(name = "change_note")
    private String changeNote;

    /** Thời điểm ghi nhận snapshot */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
