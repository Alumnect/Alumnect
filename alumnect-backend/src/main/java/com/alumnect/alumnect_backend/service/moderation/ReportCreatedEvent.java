package com.alumnect.alumnect_backend.service.moderation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sự kiện thông báo khi có một báo cáo bài viết mới được tạo (UC24).
 * Kích hoạt luồng kiểm duyệt bất đồng bộ ngầm mà không làm chậm trải nghiệm của người dùng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreatedEvent {

    /** Định danh của báo cáo vừa được lưu vào CSDL. */
    private Long reportId;

    /** Định danh của bài viết bị báo cáo. */
    private Long postId;

    /** Nội dung văn bản của bài viết bị báo cáo. */
    private String postContent;

    /** Lý do báo cáo vi phạm do người dùng chọn. */
    private String reason;

    /** Định danh của người dùng gửi báo cáo. */
    private Long reporterId;
}
