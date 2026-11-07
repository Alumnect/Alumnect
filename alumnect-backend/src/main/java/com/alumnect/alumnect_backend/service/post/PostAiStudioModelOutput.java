package com.alumnect.alumnect_backend.service.post;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Cấu trúc JSON mà Gemini được yêu cầu trả về cho AI Studio [B1] (thời gian là chuỗi ISO-8601 để tự kiểm soát
 * việc parse/chuẩn hóa ở {@link PostAiStudioServiceImpl}, tránh phụ thuộc cách model định dạng ngày).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostAiStudioModelOutput {

    private String detectedType;
    private String polishedContent;
    private Job jobData;
    private Event eventData;
    private Poster posterSpec;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Job {
        private String title;
        private String company;
        private String location;
        private Long salaryMin;
        private Long salaryMax;
        private String contactEmail;
        private String applyUrl;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Event {
        private String title;
        private String location;
        private String startTime;
        private String endTime;
        private Integer capacity;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Poster {
        private String illustrationScene;
        private String colorPalette;
        private String badgeText;
        private String headline;
        private String subheadline;
        private String highlightPill;
        private String locationText;
        private List<String> bulletPoints;
    }
}
