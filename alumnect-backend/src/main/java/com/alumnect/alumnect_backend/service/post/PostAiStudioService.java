package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.dto.request.post.PostAiStudioRequest;
import com.alumnect.alumnect_backend.dto.response.post.PostAiStudioResponse;

/**
 * Dịch vụ AI Studio [B1]: từ một câu ý tưởng ngắn tạo ra bài viết hoàn chỉnh + dữ liệu tự điền form + cấu hình Poster.
 */
public interface PostAiStudioService {

    /**
     * Sinh bài viết, dữ liệu form và cấu hình Poster trong một lần gọi Gemini (tối đa ~4 giây, quá hạn/lỗi thì dùng
     * bộ Template cục bộ nên luôn có kết quả).
     *
     * @param email   Email người dùng đang đăng nhập
     * @param request Ý tưởng ngắn của người dùng
     * @return Kết quả AI Studio
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException        nếu không phải Sinh viên/Cựu sinh viên
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy tài khoản
     */
    PostAiStudioResponse generate(String email, PostAiStudioRequest request);
}
