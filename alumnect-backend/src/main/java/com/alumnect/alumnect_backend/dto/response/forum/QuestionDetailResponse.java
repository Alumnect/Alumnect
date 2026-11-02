package com.alumnect.alumnect_backend.dto.response.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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

    /** Tên thể loại của câu hỏi (chuỗi rỗng nếu chưa phân loại) */
    private String topic;

    /** ID thể loại của câu hỏi (null nếu chưa phân loại) — dùng để quay về danh sách đã lọc theo thể loại */
    private Long topicId;

    /** Tên ngành của câu hỏi (chuỗi rỗng nếu chưa chọn ngành) */
    private String major;

    /** ID ngành của câu hỏi (null nếu chưa chọn ngành) — dùng để quay về danh sách đã lọc theo ngành */
    private Long majorId;

    /** Danh sách URL ảnh đính kèm (rỗng nếu không có) */
    private List<String> images;

    /** ID tác giả câu hỏi (dạng chuỗi) — Frontend so khớp với người đăng nhập để hiện nút "Chỉnh sửa" (UC46) */
    private String authorId;

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

    /** true nếu người xem hiện tại đã bình chọn câu hỏi này (UC42 - Vote on a question); luôn false với Guest */
    private boolean voted;

    /** Số câu trả lời của câu hỏi */
    private int answers;

    /** Thời gian đăng câu hỏi, định dạng tương đối ngắn gọn (VD: "2h", "3d") đã tính sẵn phía Backend */
    private String time;

    /** Thời điểm tạo câu hỏi ở dạng ISO-8601 tuyệt đối (VD: "2026-07-11T09:30:00Z") để Frontend hiển thị ngày đăng đầy đủ */
    private String createdAt;
}
