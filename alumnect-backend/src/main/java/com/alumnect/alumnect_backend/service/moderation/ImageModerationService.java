package com.alumnect.alumnect_backend.service.moderation;

import java.util.List;

/**
 * Dịch vụ kiểm duyệt hình ảnh tự động bằng AI (Multimodal Vision).
 * Phát hiện ảnh nhạy cảm (18+ / NSFW) hoặc bạo lực / máu me theo cơ chế nhị phân (vi phạm / an toàn).
 */
public interface ImageModerationService {

    /**
     * Kiểm tra danh sách URL hình ảnh đính kèm bài viết.
     *
     * @param imageUrls       Danh sách URL ảnh của bài viết
     * @param postContextText Nội dung chữ đi kèm bài viết (giúp AI hiểu ngữ cảnh, tránh bắt nhầm)
     * @return Kết quả kiểm duyệt nhị phân
     */
    ImageModerationResult checkImages(List<String> imageUrls, String postContextText);
}

