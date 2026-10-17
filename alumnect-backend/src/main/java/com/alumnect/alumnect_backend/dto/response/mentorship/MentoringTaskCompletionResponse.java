package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringCompletionStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;

/**
 * Phản hồi chi tiết lần nộp kết quả nghiệm thu hoàn thành Task (UC110).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskCompletionResponse {

    /** ID của lần nộp kết quả */
    private Long id;

    /** ID của nhiệm vụ Mentoring Task */
    private Long taskId;

    /** ID cuộc trò chuyện Chat for Task */
    private Long conversationId;

    /** Người nộp kết quả (Mentor) */
    private MentoringParticipantResponse submittedBy;

    /** Mô tả tóm tắt kết quả hoàn thành */
    private String finalSummary;

    /** Nội dung bàn giao, ghi chú sản phẩm hoặc đường dẫn deliverables */
    private String deliverables;

    /** Danh sách URLs tài liệu/ảnh chứng từ đính kèm */
    private List<String> attachmentUrls;

    /** Trạng thái nghiệm thu: PENDING, CONFIRMED, REJECTED, SUPERSEDED */
    private MentoringCompletionStatus status;

    /** Người phản hồi nghiệm thu (Student) */
    private MentoringParticipantResponse respondedBy;

    /** Thời điểm phản hồi */
    private Instant respondedAt;

    /** Ghi chú phản hồi / lý do yêu cầu chỉnh sửa */
    private String feedbackNote;

    /** Thời điểm nộp */
    private Instant createdAt;

    /** Thời điểm cập nhật */
    private Instant updatedAt;

    /** Người dùng hiện tại (Student) có quyền xác nhận/từ chối hay không */
    private Boolean canConfirm;
}
