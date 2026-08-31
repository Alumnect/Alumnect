package com.alumnect.alumnect_backend.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.List;
import com.alumnect.alumnect_backend.dto.response.post.JobDTO;
import com.alumnect.alumnect_backend.dto.response.post.EventDTO;


/**
 * DTO chứa thông tin chi tiết bài viết cộng đồng trả về cho giao diện Quản trị viên (Admin).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPostResponse {

    /** ID bài viết */
    private Long id;

    /** Họ tên tác giả */
    private String authorName;

    /** Email của tác giả */
    private String authorEmail;

    /** URL ảnh đại diện của tác giả */
    private String authorAvatarUrl;

    /** Loại bài viết: NORMAL, ACHIEVEMENT, RECRUITMENT, EVENT */
    private String type;

    /** Nội dung văn bản của bài viết */
    private String content;

    /** URL ảnh đính kèm bài viết (nếu có) */
    private String imageUrl;

    /** Phạm vi hiển thị: PUBLIC, MEMBERS */
    private String visibility;

    /** Số lượt thích */
    private int likeCount;

    /** Số lượt bình luận */
    private int commentCount;

    /** Số lượt đăng lại */
    private int repostCount;

    /** Trạng thái ẩn của bài viết */
    private boolean hidden;

    /** Trạng thái đã xóa của bài viết */
    private boolean deleted;

    /** Thời điểm tạo bài viết */
    private Instant createdAt;

    /** Danh sách ảnh đính kèm */
    private List<String> images;

    /** Chi tiết tin tuyển dụng liên kết */
    private JobDTO job;

    /** Chi tiết sự kiện liên kết */
    private EventDTO event;
}
