package com.alumnect.alumnect_backend.dto.response.report;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

/** Phản hồi an toàn cho người vừa gửi báo cáo; không tiết lộ dữ liệu kiểm duyệt nội bộ. */
@Value
@Builder
public class ReportResponse {
    Long id;
    Long postId;
    ReportReason reason;
    String description;
    ReportStatus status;
    Instant createdAt;
}
