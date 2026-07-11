package com.alumnect.alumnect_backend.dto.response.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin chi tiết một câu hỏi trả về cho Client (UC39 - View question detail).
 * Khác với {@link QuestionResponse} (dùng cho danh sách, chỉ có đoạn trích ngắn), DTO này
 * mang <b>toàn bộ nội dung câu hỏi</b> ({@code body}) cùng thông tin phong phú hơn về tác giả
 * (dòng tiêu đề headline) và mốc thời gian tuyệt đối ({@code createdAt}) để dựng màn hình chi tiết.
 * Cấu trúc phẳng (flat) khớp trực tiếp với schema Zod {@code questionDetailSchema} phía Frontend
 * (xem {@code alumnect-frontend/src/features/forum/model/question.ts}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDetailResponse {

    /** ID câu hỏi (dạng chuỗi để Frontend không mất độ chính xác số lớn) */
    private String id;

    /** Tiêu đề câu hỏi */
    private String title;

    /** Toàn bộ nội dung chi tiết của câu hỏi (không cắt trích như danh sách) */
    private String body;

    /** Tên chủ đề của câu hỏi (chuỗi rỗng nếu chưa phân loại) */
    private String topic;

    /** ID chủ đề của câu hỏi (null nếu chưa phân loại) — dùng để quay về danh sách đã lọc theo chủ đề */
    private Long topicId;

    /** Họ và tên tác giả câu hỏi */
    private String author;

    /** URL ảnh đại diện của tác giả (chuỗi rỗng nếu không có) */
    private String avatar;

    /** Dòng tiêu đề ngắn (headline) của tác giả, VD: "Software Engineer tại FPT Software" (chuỗi rỗng nếu không có) */
    private String authorHeadline;

    /** true nếu tác giả là tài khoản đã được xác thực (huy hiệu Verified) */
    private boolean verified;

    /** Số lượt vote của câu hỏi */
    private int votes;

    /** Số câu trả lời của câu hỏi */
    private int answers;

    /** Thời gian đăng câu hỏi, định dạng tương đối ngắn gọn (VD: "2h", "3d") đã tính sẵn phía Backend */
    private String time;

    /** Thời điểm tạo câu hỏi ở dạng ISO-8601 tuyệt đối (VD: "2026-07-11T09:30:00Z") để Frontend hiển thị ngày đăng đầy đủ */
    private String createdAt;
}
