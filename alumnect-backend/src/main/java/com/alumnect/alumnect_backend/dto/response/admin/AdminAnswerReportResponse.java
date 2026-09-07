package com.alumnect.alumnect_backend.dto.response.admin;

import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO chứa thông tin chi tiết báo cáo câu trả lời vi phạm dành cho giao diện Quản trị viên (UC79).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnswerReportResponse {

    /** ID của báo cáo vi phạm */
    private Long id;

    /** ID của câu trả lời bị báo cáo */
    private Long answerId;

    /** Nội dung của câu trả lời bị báo cáo */
    private String answerContent;

    /** Trạng thái hiện tại của câu trả lời (ACTIVE, HIDDEN, DELETED) */
    private AnswerStatus answerStatus;

    /** ID của câu hỏi chứa câu trả lời này */
    private Long questionId;

    /** Tiêu đề của câu hỏi chứa câu trả lời này */
    private String questionTitle;

    /** Nội dung chi tiết của câu hỏi chứa câu trả lời này */
    private String questionBody;

    /** Họ tên tác giả của câu hỏi gốc */
    private String questionAuthorName;

    /** ID của tác giả câu trả lời */
    private Long answerAuthorId;

    /** Họ tên tác giả câu trả lời */
    private String answerAuthorName;

    /** Email tác giả câu trả lời */
    private String answerAuthorEmail;

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
