package com.alumnect.alumnect_backend.integration.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Cài đặt {@link GeminiClient} gọi REST API {@code models/{model}:generateContent} của Google Gemini bằng
 * {@link HttpClient} chuẩn của JDK (không thêm thư viện mới).
 * <p>
 * Hỗ trợ danh sách model ưu tiên và tự động chuyển đổi sang model dự phòng (fallback) nếu gặp lỗi 429 (Rate Limit),
 * 503 (Spike/Overload) hoặc 404 trước khi rơi vào Smart Local Fallback.
 */
@Component
@Slf4j
public class GeminiClientImpl implements GeminiClient {

    /** Cùng cách dùng ObjectMapper (Jackson 2) như các service khác trong dự án; không phụ thuộc bean của Spring. */
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;
    private final String apiKey;
    private final List<String> models;
    private final String baseUrl;
    private final long timeoutMs;

    public GeminiClientImpl(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-3-flash-preview}") String modelConfig,
            @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${app.gemini.timeout-ms:10000}") long timeoutMs) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.timeoutMs = timeoutMs > 0 ? timeoutMs : 10000;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.min(this.timeoutMs, 3000)))
                .build();

        Set<String> modelSet = new LinkedHashSet<>();
        if (modelConfig != null && !modelConfig.isBlank()) {
            for (String m : modelConfig.split("[,;\\s]+")) {
                if (!m.isBlank()) {
                    modelSet.add(m.trim());
                }
            }
        }
        // Bổ sung các model ổn định theo thứ tự ưu tiên phòng khi model chính quá tải / hết quota
        modelSet.add("gemini-3-flash-preview");
        modelSet.add("gemini-3.5-flash");
        modelSet.add("gemini-3.1-flash-lite");
        modelSet.add("gemini-3.6-flash");
        modelSet.add("gemini-2.5-flash");
        this.models = new ArrayList<>(modelSet);
        log.info("Khởi tạo GeminiClient với {} candidate models: {}", this.models.size(), this.models);
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    @Override
    public <T> Optional<T> generateStructured(String systemInstruction, String userPrompt, Class<T> responseType) {
        if (!isConfigured()) {
            log.debug("Chưa cấu hình GEMINI_API_KEY -> dùng Smart Local Fallback");
            return Optional.empty();
        }
        long started = System.currentTimeMillis();

        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.4,
                        "maxOutputTokens", 3072,
                        "thinkingConfig", Map.of("thinkingBudget", 0)));

        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(body);
        } catch (Exception ex) {
            log.error("Không thể serialize Gemini request body: {}", ex.getMessage());
            return Optional.empty();
        }

        for (String currentModel : models) {
            long elapsed = System.currentTimeMillis() - started;
            long remainingMs = timeoutMs - elapsed;
            if (remainingMs < 800) {
                log.warn("Gemini hết budget thời gian (đã qua {}ms / {}ms) -> dùng Smart Local Fallback", elapsed, timeoutMs);
                break;
            }

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(baseUrl + "/models/" + currentModel + ":generateContent"))
                        .timeout(Duration.ofMillis(remainingMs))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> response = httpClient
                        .sendAsync(request, HttpResponse.BodyHandlers.ofString())
                        .orTimeout(remainingMs, TimeUnit.MILLISECONDS)
                        .join();

                if (response.statusCode() / 100 != 2) {
                    log.warn("Gemini ({}) trả mã {} sau {}ms -> thử model kế tiếp",
                            currentModel, response.statusCode(), System.currentTimeMillis() - started);
                    continue;
                }

                GeminiResponse parsed = objectMapper.readValue(response.body(), GeminiResponse.class);
                String text = parsed.firstText();
                if (text == null || text.isBlank()) {
                    log.warn("Gemini ({}) không trả nội dung -> thử model kế tiếp", currentModel);
                    continue;
                }

                T result = objectMapper.readValue(stripCodeFence(text), responseType);
                log.info("Gemini ({}) phản hồi thành công sau {}ms", currentModel, System.currentTimeMillis() - started);
                return Optional.ofNullable(result);
            } catch (Exception ex) {
                log.warn("Gọi Gemini ({}) thất bại sau {}ms ({}): {} -> thử model kế tiếp",
                        currentModel, System.currentTimeMillis() - started, ex.getClass().getSimpleName(), ex.getMessage());
            }
        }

        log.warn("Tất cả các model Gemini đều không phản hồi sau {}ms -> chuyển sang Smart Local Fallback",
                System.currentTimeMillis() - started);
        return Optional.empty();
    }

    /** Phòng trường hợp model bọc JSON trong khối ```json ... ``` dù đã ép responseMimeType. */
    private static String stripCodeFence(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNewline = t.indexOf('\n');
            int lastFence = t.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                return t.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return t;
    }

    /** Phần vỏ ngoài của phản hồi {@code generateContent} — chỉ lấy đoạn text đầu tiên của ứng viên đầu tiên. */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiResponse {
        private List<Candidate> candidates;

        String firstText() {
            if (candidates == null || candidates.isEmpty() || candidates.get(0).getContent() == null) {
                return null;
            }
            List<Part> parts = candidates.get(0).getContent().getParts();
            if (parts == null) {
                return null;
            }
            StringBuilder sb = new StringBuilder();
            for (Part part : parts) {
                if (part != null && part.getText() != null) {
                    sb.append(part.getText());
                }
            }
            return sb.toString();
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Candidate {
        private Content content;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Content {
        private List<Part> parts;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Part {
        private String text;
    }
}
