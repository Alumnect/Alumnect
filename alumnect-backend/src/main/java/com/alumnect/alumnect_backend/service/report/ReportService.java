package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.dto.request.report.CreatePostReportRequest;
import com.alumnect.alumnect_backend.dto.response.report.ReportResponse;

/** Nghiệp vụ báo cáo nội dung và nền tảng cho các luồng kiểm duyệt. */
public interface ReportService {

    /** Ghi nhận báo cáo của Student/Alumni đối với một bài viết đang hoạt động. */
    ReportResponse reportPost(String email, Long postId, CreatePostReportRequest request);
}
