package com.alumnect.alumnect_backend.dto.response.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin một câu hỏi trả về cho Client (UC38 - View question list).
 * Cấu trúc phẳng (flat) khớp trực tiếp với schema Zod {@code questionSchema} phía Frontend
 * (xem {@code alumnect-frontend/src/features/forum/model/question.ts}) để không cần tầng
 * chuyển đổi thêm ở phía Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {

    /** ID câu hỏi (dạng chuỗi để Frontend không mất độ chính xác số lớn) */
    private String id;

    /** Tiêu đề câu hỏi */
    private String title;

    /** Đoạn trích ngắn từ nội dung câu hỏi (tối đa ~160 ký tự) để xem trước trên danh sách */
    private String excerpt;

    /** Tên chủ đề của câu hỏi (chuỗi rỗng nếu chưa phân loại) */
    private String topic;

    /** Họ và tên tác giả câu hỏi */
    private String author;

    /** URL ảnh đại diện của tác giả (chuỗi rỗng nếu không có) */
    private String avatar;

    /** true nếu tác giả là tài khoản đã được xác thực (huy hiệu Verified) */
    private boolean verified;

    /** Số lượt vote của câu hỏi */
    private int votes;

    /** Số câu trả lời của câu hỏi */
    private int answers;

    /** Thời gian đăng câu hỏi, định dạng tương đối ngắn gọn (VD: "2h", "3d") đã tính sẵn phía Backend */
    private String time;
}
