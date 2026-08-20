package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin một bình luận trả về cho Client (UC16 - View Post Detail).
 * Cấu trúc phẳng (flat) khớp trực tiếp với schema Zod {@code commentSchema} phía Frontend
 * để không cần tầng chuyển đổi thêm ở Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

    /** ID bình luận (dạng chuỗi để Frontend không mất độ chính xác số lớn) */
    private String id;

    /** ID tác giả bình luận (dạng chuỗi) */
    private String authorId;

    /** Họ và tên tác giả bình luận */
    private String author;

    /** Dòng tiêu đề nghề nghiệp của tác giả (VD: "Software Engineer @ FPT Software") */
    private String role;

    /** URL ảnh đại diện của tác giả */
    private String avatar;

    /** true nếu tác giả là tài khoản đã được Admin xác thực (huy hiệu Verified) */
    private boolean verified;

    /** Thời gian đăng bình luận, định dạng tương đối ngắn gọn (VD: "2h", "3d") đã tính sẵn phía Backend */
    private String time;

    /** Nội dung văn bản của bình luận */
    private String text;

    /** ID bình luận cha nếu đây là một trả lời (1 cấp); null nếu là bình luận gốc */
    private String parentId;
}