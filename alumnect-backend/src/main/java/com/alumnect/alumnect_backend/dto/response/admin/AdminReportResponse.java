package com.alumnect.alumnect_backend.dto.response.admin;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO chứa thông tin chi tiết báo cáo vi phạm bài viết dành cho giao diện Quản trị viên (Admin).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportResponse {

    /** ID của báo cáo */
    private Long id;

    /** ID của bài viết bị báo cáo */
    private Long postId;

    /** Nội dung văn bản của bài viết bị báo cáo */
    private String postContent;

    /** Trạng thái hiện tại của bài viết bị báo cáo */
    private String postStatus;

    /** ID của tác giả bài viết bị báo cáo */
    private Long postAuthorId;

    /** Họ tên tác giả bài viết bị báo cáo */
    private String postAuthorName;

    /** Email tác giả bài viết bị báo cáo */
    private String postAuthorEmail;

    /** ID của người gửi báo cáo (reporter) */
    private Long reporterId;

    /** Họ tên người gửi báo cáo */
    private String reporterName;

    /** Email người gửi báo cáo */
    private String reporterEmail;

    /** Ảnh đại diện của người gửi báo cáo */
    private String reporterAvatarUrl;

    /** Lý do báo cáo (SPAM, INAPPROPRIATE, ...) */
    private ReportReason reason;

    /** Mô tả chi tiết của báo cáo */
    private String description;

    /** Trạng thái của báo cáo (PENDING, RESOLVED, DISMISSED) */
    private ReportStatus status;

    /** Thời điểm gửi báo cáo */
    private Instant createdAt;
}
