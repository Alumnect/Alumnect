package com.alumnect.alumnect_backend.dto.response.admin;

import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO chứa thông tin chi tiết báo cáo câu hỏi vi phạm dành cho giao diện Quản trị viên (UC78).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminQuestionReportResponse {

    /** ID của báo cáo vi phạm */
    private Long id;

    /** ID của câu hỏi bị báo cáo */
    private Long questionId;

    /** Tiêu đề của câu hỏi bị báo cáo */
    private String questionTitle;

    /** Nội dung chi tiết của câu hỏi bị báo cáo */
    private String questionBody;

    /** Trạng thái hiện tại của câu hỏi (ACTIVE, HIDDEN, DELETED) */
    private QuestionStatus questionStatus;

    /** ID chủ đề của câu hỏi (nếu có) */
    private Long topicId;

    /** Tên chủ đề của câu hỏi (nếu có) */
    private String topicName;

    /** ID của tác giả đặt câu hỏi */
    private Long questionAuthorId;

    /** Họ tên tác giả câu hỏi */
    private String questionAuthorName;

    /** Email tác giả câu hỏi */
    private String questionAuthorEmail;

    /** ID người báo cáo */
    private Long reporterId;

    /** Họ tên người báo cáo */
    private String reporterName;

    /** Email người báo cáo */
    private String reporterEmail;

    /** Ảnh đại diện người báo cáo */
    private String reporterAvatarUrl;

    /** Lý do vi phạm (SPAM, INAPPROPRIATE, MISINFORMATION, SCAM_OR_FRAUD, OTHER) */
    private ReportReason reason;

    /** Mô tả chi tiết lý do từ người báo cáo */
    private String description;

    /** Trạng thái báo cáo (PENDING, RESOLVED, DISMISSED) */
    private ReportStatus status;

    /** Thời điểm gửi báo cáo */
    private Instant createdAt;
}
