package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO chứa thông tin một bài viết trả về cho Client (UC15 - View community Feed).
 * Cấu trúc phẳng (flat) khớp trực tiếp với schema Zod {@code postSchema} phía Frontend
 * (xem {@code alumnect-frontend/src/features/feed/model/post.ts}) để không cần tầng
 * chuyển đổi thêm ở phía Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {

    /** ID bài viết (dạng chuỗi để Frontend không gặp vấn đề mất độ chính xác số lớn) */
    private String id;

    /** Loại bài viết, viết thường: "normal" | "achievement" | "recruitment" | "event" */
    private String type;

    /** Họ và tên tác giả bài viết */
    private String author;

    /** Dòng tiêu đề nghề nghiệp của tác giả (VD: "Software Engineer @ FPT Software") */
    private String role;

    /** URL ảnh đại diện của tác giả */
    private String avatar;

    /** true nếu tác giả là tài khoản đã được Admin xác thực (huy hiệu Verified) */
    private boolean verified;

    /** Thời gian đăng bài, định dạng tương đối ngắn gọn (VD: "2h", "3d") đã tính sẵn phía Backend */
    private String time;

    /** Nội dung văn bản của bài viết */
    private String text;

    /** Danh sách URL ảnh đính kèm bài viết (nhiều ảnh) */
    private List<String> images;

    /** Số lượt thích */
    private int likes;

    /** Số lượt bình luận */
    private int comments;

    /** Số lượt đăng lại */
    private int reposts;

    /**
     * Bài viết này đã được người xem hiện tại thích hay chưa.
     * UC15 chỉ triển khai phần XEM bảng tin — chưa lưu trạng thái "ai đã thích bài nào",
     * nên trường này luôn trả về false ở giai đoạn hiện tại (sẽ triển khai ở UC "Like Post" riêng).
     */
    private boolean liked;

    /** ID của sự kiện liên kết (nếu có) */
    private String eventId;

    /** ID của tin tuyển dụng liên kết (nếu có) */
    private String jobId;

    /** Thông tin sự kiện (nếu là bài viết sự kiện) */
    private EventDTO event;

    /** Thông tin tuyển dụng (nếu là bài viết tuyển dụng) */
    private JobDTO job;
}
