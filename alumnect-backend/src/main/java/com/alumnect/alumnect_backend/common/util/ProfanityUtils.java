package com.alumnect.alumnect_backend.common.util;

import java.util.regex.Pattern;

/**
 * Lớp tiện ích hỗ trợ chuẩn hóa văn bản trước khi quét từ cấm (Profanity Normalization).
 * Xử lý leetspeak (thay số bằng chữ cái tương ứng) và các ký tự phân cách cố ý chèn vào để lách bộ lọc.
 */
public final class ProfanityUtils {

    private static final Pattern MULTI_WHITESPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern REPEATED_CHARS_PATTERN = Pattern.compile("([a-z0-9])\\1{2,}");

    private ProfanityUtils() {
        // Lớp tiện ích tĩnh
    }

    /**
     * Chuẩn hóa toàn diện văn bản đầu vào:
     * 1. Khử dấu tiếng Việt qua VietnameseStringUtils
     * 2. Giải mã leetspeak (0 -> o, 1 -> i, 3 -> e, 4 -> a, 5 -> s, 7 -> t, @ -> a)
     * 3. Thay thế các ký tự đặc biệt ngăn cách (chấm, gạch nối, gạch dưới xen kẽ) thành khoảng trắng
     * 4. Rút gọn các ký tự lặp quá 2 lần (ví dụ: 'đmmmmm' -> 'đmm')
     *
     * @param input Chuỗi văn bản gốc
     * @return Chuỗi văn bản đã được chuẩn hóa để đối soát từ cấm
     */
    public static String normalizeForProfanityCheck(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // Bước 1: Khử dấu tiếng Việt và chuyển chữ thường
        String text = VietnameseStringUtils.removeAccents(input);

        // Bước 2: Thay thế leetspeak phổ biến
        text = text.replace('@', 'a')
                .replace('0', 'o')
                .replace('1', 'i')
                .replace('3', 'e')
                .replace('4', 'a')
                .replace('5', 's')
                .replace('7', 't')
                .replace('$', 's')
                .replace('!', 'i');

        // Bước 3: Thay thế các ký tự phân cách có chủ đích (d.m, d-m, d_m -> dm)
        // Nếu các ký tự chấm/gạch nằm giữa các chữ cái, gộp chúng lại
        text = text.replaceAll("(?<=\\w)[.\\-_*#~](?=\\w)", "");

        // Thay các ký tự không phải chữ và số còn lại bằng khoảng trắng
        text = text.replaceAll("[^a-z0-9\\s]", " ");

        // Rút gọn ký tự lặp (ví dụ: lllôôôn -> llon)
        text = REPEATED_CHARS_PATTERN.matcher(text).replaceAll("$1$1");

        // Rút gọn khoảng trắng thừa
        return MULTI_WHITESPACE_PATTERN.matcher(text.trim()).replaceAll(" ");
    }
}
