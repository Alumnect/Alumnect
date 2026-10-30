package com.alumnect.alumnect_backend.service.moderation;

/**
 * Giao diện dịch vụ kiểm duyệt nội dung tự động dựa trên thuật toán phân tầng điểm rủi ro.
 */
public interface ContentModerationService {

    /**
     * Đánh giá mức độ độc hại và tính điểm vi phạm cho văn bản bài viết hoặc báo cáo.
     *
     * @param text Nội dung văn bản cần kiểm duyệt
     * @return Kết quả đánh giá bao gồm điểm số, từ khóa và quyết định phân loại
     */
    ModerationResult evaluateContent(String text);
}
