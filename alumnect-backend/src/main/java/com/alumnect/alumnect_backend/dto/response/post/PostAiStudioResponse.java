package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO kết quả của AI Studio [B1] — gồm 3 phần trả về trong CÙNG một lần gọi: (a) loại bài + nội dung hoàn chỉnh,
 * (b) dữ liệu có cấu trúc để tự điền form Job/Event, (c) cấu hình thiết kế Poster để trình duyệt kết xuất Canvas.
 * Thời gian sự kiện trả về dạng chuỗi ISO-8601 UTC (khớp định dạng form tạo bài hiện có).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostAiStudioResponse {

    /** Loại bài phù hợp nhất: recruitment | event | achievement | normal. */
    private String detectedType;

    /** Nội dung bài đăng hoàn chỉnh, trình bày đẹp mắt (tối đa 5000 ký tự để khớp ràng buộc đăng bài). */
    private String polishedContent;

    /** Dữ liệu tự điền form Tuyển dụng (null nếu không phải bài tuyển dụng). */
    private JobData jobData;

    /** Dữ liệu tự điền form Sự kiện (null nếu không phải bài sự kiện). */
    private EventData eventData;

    /** Cấu hình thiết kế Poster. */
    private PosterSpec posterSpec;

    /** Nguồn xử lý: "GEMINI" hoặc "LOCAL_FALLBACK". */
    private String source;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobData {
        private String title;
        private String company;
        private String location;
        private Long salaryMin;
        private Long salaryMax;
        private String contactEmail;
        private String applyUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventData {
        private String title;
        private String location;
        /** ISO-8601 UTC, ví dụ 2026-11-20T12:30:00Z. */
        private String startTime;
        private String endTime;
        private Integer capacity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PosterSpec {
        /** Một trong 8 cảnh vật: TECH_CODE_WORKSPACE, AI_CLOUD_SERVER, FINANCE_BANKING_TOWER, ... */
        private String illustrationScene;
        /** Một trong 5 bảng màu: FPT_SIGNATURE, CYBER_INDIGO, EMERALD_FINANCE, ROYAL_GOLD, CRIMSON_EVENT. */
        private String colorPalette;
        private String badgeText;
        /** Tiêu đề lớn in trên Poster (tối đa 45 ký tự). */
        private String headline;
        private String subheadline;
        private String highlightPill;
        private String locationText;
        /** Tối đa 3 điểm nổi bật in trên các thẻ kính mờ. */
        private List<String> bulletPoints;
    }
}
