package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.enums.ProfanitySeverity;

/**
 * Một vị trí vi phạm được phát hiện trong văn bản.
 *
 * @param term       Từ khóa trong từ điển đã khớp, dùng để hiển thị cho Admin
 * @param severity   Mức độ nghiêm trọng sau khi đã xét ngữ cảnh gõ dấu
 * @param start      Vị trí bắt đầu trong văn bản gốc (tính theo ký tự UTF-16)
 * @param end        Vị trí kết thúc (không bao gồm) trong văn bản gốc
 * @param obfuscated Người viết có cố tình né bộ lọc hay không (chèn ký tự, thay số, tách chữ)
 */
public record ProfanityMatch(String term, ProfanitySeverity severity, int start, int end, boolean obfuscated) {
}
