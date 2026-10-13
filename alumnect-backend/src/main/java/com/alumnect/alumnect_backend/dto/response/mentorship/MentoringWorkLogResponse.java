package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Phản hồi chi tiết một bản ghi nhật ký công việc Mentoring Work Log (UC107).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringWorkLogResponse {

    /** ID của Work Log */
    private Long id;

    /** ID Task liên quan */
    private Long taskId;

    /** ID Mentor tạo bản ghi */
    private Long mentorId;

    /** Họ tên Mentor */
    private String mentorName;

    /** Avatar Mentor */
    private String mentorAvatar;

    /** Ngày thực hiện công việc */
    private LocalDate logDate;

    /** Mô tả công việc */
    private String description;

    /** Nội dung công việc hoàn thành */
    private String workCompleted;

    /** Kết quả đạt được */
    private String result;

    /** Kế hoạch/hành động tiếp theo */
    private String nextAction;

    /** Trạng thái xác nhận (PENDING_CONFIRMATION, CONFIRMED, REJECTED) */
    private WorkLogStatus status;

    /** Phản hồi của học viên (nếu có) */
    private String studentFeedback;

    /** Thời điểm học viên xác nhận */
    private Instant confirmedAt;

    /** ID học viên đã xác nhận */
    private Long confirmedBy;

    /** Họ tên học viên đã xác nhận */
    private String confirmedByName;

    /** Phiên bản hiện tại của Work Log */
    private Integer revisionNumber;

    /** Danh sách tài liệu minh chứng đính kèm */
    @Builder.Default
    private List<MentoringWorkLogAttachmentResponse> attachments = new ArrayList<>();

    /** Lịch sử phản hồi từ học viên */
    @Builder.Default
    private List<MentoringWorkLogFeedbackResponse> feedbacks = new ArrayList<>();

    /** Lịch sử các phiên bản sửa đổi của Work Log */
    @Builder.Default
    private List<MentoringWorkLogRevisionResponse> revisions = new ArrayList<>();

    /** Thời điểm tạo */
    private Instant createdAt;

    /** Thời điểm cập nhật gần nhất */
    private Instant updatedAt;

    /** Cờ quyền hạn: Cho biết người dùng hiện tại có được phép chỉnh sửa log này hay không */
    private Boolean canEdit;

    /** Cờ quyền hạn: Cho biết học viên hiện tại có được phép xác nhận nghiệm thu log này hay không */
    private Boolean canConfirm;

    /** Cờ quyền hạn: Cho biết học viên hiện tại có được phép yêu cầu điều chỉnh log này hay không */
    private Boolean canReject;
}

