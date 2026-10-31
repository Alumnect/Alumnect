package com.alumnect.alumnect_backend.service.moderation;

import java.util.List;

/**
 * Giao diện dịch vụ lọc và phát hiện từ cấm đa ngôn ngữ (Tiếng Việt và Tiếng Anh).
 */
public interface ProfanityFilterService {

    /**
     * Phân tích văn bản và trả về mọi vị trí vi phạm, gồm cả tín hiệu yếu.
     *
     * @param text Văn bản cần phân tích
     * @return Danh sách vị trí vi phạm theo thứ tự xuất hiện, rỗng nếu an toàn
     */
    List<ProfanityMatch> analyze(String text);

    /**
     * Kiểm tra xem chuỗi văn bản có chứa từ cấm thực sự hay không; tín hiệu yếu không được tính.
     *
     * @param text Văn bản cần kiểm tra
     * @return true nếu có từ cấm, ngược lại false
     */
    boolean containsProfanity(String text);

    /**
     * Tìm danh sách các từ cấm xuất hiện trong văn bản; tín hiệu yếu không được tính.
     *
     * @param text Văn bản cần kiểm tra
     * @return Danh sách các từ cấm được phát hiện (không trùng lặp)
     */
    List<String> findProfanities(String text);

    /**
     * Thay thế các từ cấm trong văn bản bằng chuỗi ký tự che giấu '***', không dài hơn từ gốc.
     *
     * @param text Văn bản gốc
     * @return Văn bản đã được che các từ ngữ nhạy cảm
     */
    String maskProfanity(String text);
}
