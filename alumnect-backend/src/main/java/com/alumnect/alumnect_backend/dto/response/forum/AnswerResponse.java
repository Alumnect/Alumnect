package com.alumnect.alumnect_backend.dto.response.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa thông tin một câu trả lời trả về cho Client (UC41 - Answer a question, UC48 - Edit an answer).
 * Cấu trúc phẳng (flat) khớp trực tiếp với schema Zod {@code answerSchema} phía Frontend
 * để không cần tầng chuyển đổi thêm ở phía Client. Câu trả lời gốc mang kèm danh sách {@code replies}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {

    /** ID câu trả lời (dạng chuỗi để Frontend không mất độ chính xác số lớn) */
    private String id;

    /** ID câu trả lời cha (null nếu là câu trả lời gốc) — đánh dấu đây là reply của câu trả lời nào */
    private String parentId;

    /** ID tác giả câu trả lời (dạng chuỗi) */
    private String authorId;

    /** Nội dung câu trả lời */
    private String body;

    /** Họ và tên tác giả câu trả lời */
    private String author;

    /** URL ảnh đại diện của tác giả (chuỗi rỗng nếu không có) */
    private String avatar;

    /** Dòng tiêu đề/nghề nghiệp của tác giả (chuỗi rỗng nếu chưa có) */
    private String authorHeadline;

    /** true nếu tác giả là tài khoản đã được xác thực (huy hiệu Verified) */
    private boolean verified;

    /** Số lượt vote của câu trả lời */
    private int votes;

    /** true nếu người xem hiện tại đã bình chọn câu trả lời này (UC43 - Vote on an answer); luôn false với Guest */
    private boolean voted;

    /** Thời gian đăng câu trả lời, định dạng tương đối ngắn gọn (VD: "2h", "3d") đã tính sẵn phía Backend */
    private String time;

    /** Mốc thời gian tuyệt đối (ISO-8601) tạo câu trả lời */
    private String createdAt;

    /** true nếu câu trả lời đã từng được chỉnh sửa (updated_at trễ hơn created_at) — để hiển thị "Đã chỉnh sửa" */
    private boolean edited;

    /** Danh sách reply của câu trả lời gốc này (rỗng nếu không có, hoặc bản thân đây là reply) */
    private List<AnswerResponse> replies;
}
