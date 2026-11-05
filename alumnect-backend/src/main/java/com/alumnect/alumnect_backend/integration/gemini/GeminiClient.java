package com.alumnect.alumnect_backend.integration.gemini;

import java.util.Optional;

/**
 * Cổng giao tiếp với Google Gemini cho các tính năng AI của AlumNect (A1 Lương, B1 AI Studio, C2 So sánh lộ trình).
 * <p>
 * Hợp đồng quan trọng: mọi phương thức KHÔNG BAO GIỜ ném ngoại lệ ra ngoài. Khi thiếu API key, mạng lỗi,
 * Gemini trả lỗi, phản hồi chậm quá timeout (mặc định 4 giây) hoặc JSON trả về không parse được, phương thức trả
 * {@link Optional#empty()} để Service gọi chuyển ngay sang cơ chế Smart Local Fallback (không bao giờ để người
 * dùng thấy lỗi đỏ).
 */
public interface GeminiClient {

    /**
     * Gọi Gemini ở chế độ Structured JSON ({@code responseMimeType = application/json}) rồi parse kết quả sang
     * kiểu dữ liệu mong muốn.
     *
     * @param systemInstruction Chỉ dẫn hệ thống (vai trò, quy tắc, mô tả schema JSON cần trả)
     * @param userPrompt        Nội dung/ngữ cảnh cụ thể của lần gọi
     * @param responseType      Lớp POJO ánh xạ cấu trúc JSON mong đợi
     * @param <T>               Kiểu kết quả
     * @return Đối tượng đã parse, hoặc rỗng nếu bất kỳ bước nào thất bại/quá timeout
     */
    <T> Optional<T> generateStructured(String systemInstruction, String userPrompt, Class<T> responseType);

    /** @return {@code true} nếu đã cấu hình API key (chưa đảm bảo mạng/Gemini đang hoạt động) */
    boolean isConfigured();
}
