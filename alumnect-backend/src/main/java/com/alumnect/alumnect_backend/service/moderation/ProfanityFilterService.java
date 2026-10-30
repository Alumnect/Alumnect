package com.alumnect.alumnect_backend.service.moderation;

import java.util.List;

/**
 * Giao diện dịch vụ lọc và phát hiện từ cấm đa ngôn ngữ (Tiếng Việt và Tiếng Anh).
 */
public interface ProfanityFilterService {

    /**
     * Kiểm tra xem chuỗi văn bản có chứa bất kỳ từ cấm nào không.
     *
     * @param text Văn bản cần kiểm tra
     * @return true nếu có từ cấm, ngược lại false
     */
    boolean containsProfanity(String text);

    /**
     * Tìm danh sách các từ cấm xuất hiện trong văn bản.
     *
     * @param text Văn bản cần kiểm tra
     * @return Danh sách các từ cấm được phát hiện (không trùng lặp)
     */
    List<String> findProfanities(String text);

    /**
     * Thay thế các từ cấm trong văn bản bằng chuỗi ký tự che giấu (mặc định là '***').
     *
     * @param text Văn bản gốc
     * @return Văn bản đã được che các từ ngữ nhạy cảm
     */
    String maskProfanity(String text);
}
