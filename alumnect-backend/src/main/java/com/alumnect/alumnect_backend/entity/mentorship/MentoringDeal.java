package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng mentoring_deals — Thỏa thuận & xác nhận Mentoring Deal (UC104).
 * Lưu trữ trạng thái điều khoản, giá thỏa thuận, hạn chót và xác nhận giữa Student và Mentor.
 */
@Entity
@Table(name = "mentoring_deals")
@Getter
@Setter
@ToString(exclude = {"student", "mentor", "conversation", "createdBy", "updatedBy", "snapshots"})
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringDeal {

    /** Khóa chính tự tăng của thỏa thuận Mentoring Deal */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Học viên (Student) tham gia thỏa thuận cố vấn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Cố vấn (Mentor) phụ trách hướng dẫn học viên */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    /** Cuộc trò chuyện Direct Messaging liên kết giữa Student và Mentor */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Phạm vi công việc / nội dung chi tiết của Task cần thực hiện */
    @Column(name = "task_scope", columnDefinition = "TEXT", nullable = false)
    private String taskScope;

    /** Mức giá thỏa thuận cuối cùng (VND) */
    @Column(name = "agreed_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành công việc / Task */
    @Column(name = "deadline", nullable = false)
    private Instant deadline;

    /** Hình thức làm việc: ONLINE, OFFLINE, BOTH */
    @Enumerated(EnumType.STRING)
    @Column(name = "working_mode", length = 20, nullable = false)
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia: INDIVIDUAL (1-1) hoặc GROUP (nhóm) */
    @Enumerated(EnumType.STRING)
    @Column(name = "participation_type", length = 20, nullable = false)
    private MentoringParticipationType participationType;

    /** Phân loại công việc: CONSULTATION, ASSIGNMENT_GUIDANCE, PROJECT_MENTORING... */
    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", length = 50, nullable = false)
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra sau khi hoàn thành Task */
    @Column(name = "expected_result", columnDefinition = "TEXT", nullable = false)
    private String expectedResult;

    /** Số thứ tự phiên bản của thỏa thuận điều khoản (tăng mỗi khi có bên điều chỉnh) */
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    /** Trạng thái xác nhận của Học viên (Student) đối với phiên bản hiện tại */
    @Column(name = "student_confirmed", nullable = false)
    @Builder.Default
    private Boolean studentConfirmed = false;

    /** Trạng thái xác nhận của Cố vấn (Mentor) đối với phiên bản hiện tại */
    @Column(name = "mentor_confirmed", nullable = false)
    @Builder.Default
    private Boolean mentorConfirmed = false;

    /** Thời điểm Học viên xác nhận phiên bản hiện tại */
    @Column(name = "student_confirmed_at")
    private Instant studentConfirmedAt;

    /** Thời điểm Cố vấn xác nhận phiên bản hiện tại */
    @Column(name = "mentor_confirmed_at")
    private Instant mentorConfirmedAt;

    /** Trạng thái tổng thể của Deal: PROPOSED, STUDENT_CONFIRMED, MENTOR_CONFIRMED, DEAL_CONFIRMED, CANCELLED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringDealStatus status = MentoringDealStatus.PROPOSED;

    /** Cờ đánh dấu thỏa thuận đã được khóa cứng snapshot khi cả hai bên cùng xác nhận */
    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    /** Thời điểm hệ thống khóa snapshot Deal */
    @Column(name = "locked_at")
    private Instant lockedAt;

    /** Người tạo / đề xuất thỏa thuận ban đầu */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Người cập nhật / điều chỉnh snapshot gần nhất */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    /** Thời điểm tạo thỏa thuận */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật thỏa thuận */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    /** Lịch sử các phiên bản Snapshot của Deal */
    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("version ASC")
    @Builder.Default
    private List<MentoringDealSnapshot> snapshots = new ArrayList<>();
}
