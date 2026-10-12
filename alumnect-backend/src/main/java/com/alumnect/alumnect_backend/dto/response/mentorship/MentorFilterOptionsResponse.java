package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa danh mục các tùy chọn bộ lọc tìm kiếm Mentor (UC98).
 * Giúp Frontend hiển thị các dropdown và checkbox lọc dựa trên dữ liệu thực tế từ hệ thống.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorFilterOptionsResponse {

    /** Danh mục các lĩnh vực / ngành nghề (Field / Industry) */
    private List<FilterOptionItem> industries;

    /** Danh mục các chuyên ngành đào tạo (Specialization / Major) */
    private List<SpecializationOptionItem> specializations;

    /** Danh mục hình thức hướng dẫn (Working Mode) */
    private List<EnumOptionItem> workingModes;

    /** Danh mục loại hình cố vấn (Mentoring Type) */
    private List<EnumOptionItem> mentoringTypes;

    /** Danh sách các kỹ năng phổ biến nhất từ các Mentor đang hoạt động */
    private List<String> popularSkills;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterOptionItem {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecializationOptionItem {
        private Long id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnumOptionItem {
        private String value;
        private String label;
    }
}
