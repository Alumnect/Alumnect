package com.alumnect.alumnect_backend.common.util;

import java.text.Normalizer;

/**
 * Tiện ích xử lý chuỗi ký tự tiếng Việt, hỗ trợ tìm kiếm không phân biệt dấu và chuẩn hóa từ khóa.
 */
public final class VietnameseStringUtils {

    private VietnameseStringUtils() {
        // Utility class
    }

    /**
     * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu, chuyển chữ thường và cắt bỏ khoảng trắng thừa.
     * Xử lý triệt để ký tự 'đ'/'Đ' mà bộ phân rã Unicode NFD chuẩn không tách rời được.
     *
     * @param text Chuỗi đầu vào
     * @return Chuỗi không dấu ở dạng chữ thường, hoặc chuỗi rỗng/null nếu đầu vào rỗng/null
     */
    public static String removeAccents(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        String normalized = Normalizer.normalize(trimmed, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "d")
                .toLowerCase();
    }
}
