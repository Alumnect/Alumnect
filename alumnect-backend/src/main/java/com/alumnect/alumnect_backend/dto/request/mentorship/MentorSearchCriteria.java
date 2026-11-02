package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa các tiêu chí tìm kiếm và lọc danh sách Mentor (UC98).
 * Hỗ trợ tìm kiếm từ khóa kết hợp đa bộ lọc theo quy tắc logic AND liên nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorSearchCriteria {

    /** Từ khóa tìm kiếm tự do (họ tên, tiêu đề, giới thiệu, chủ đề, kỹ năng, công ty, vị trí) */
    private String keyword;

    /** ID lĩnh vực / ngành nghề chuyên môn (tham chiếu bảng industries) */
    private Long fieldId;

    /** ID chuyên ngành học (tham chiếu bảng majors) */
    private Long specializationId;

    /** Chuỗi tên hoặc mã chuyên ngành học (VD: "SE", "Kỹ thuật phần mềm") */
    private String specialization;

    /** Kỹ năng chuyên môn cụ thể cần lọc (VD: "Java", "React", "Spring Boot") */
    private String skill;

    /** Danh sách kỹ năng chuyên môn nếu truyền nhiều kỹ năng */
    private List<String> skills;

    /** Hình thức làm việc / hướng dẫn: ONLINE, OFFLINE, BOTH */
    private MentoringWorkingMode workingMode;

    /** Loại hình cố vấn: INDIVIDUAL, GROUP, BOTH */
    private MentoringType mentoringType;

    /** Tiêu chí sắp xếp: "reputationScore", "rating", "completedTasks", "newest" (mặc định: "reputationScore") */
    @Builder.Default
    private String sortBy = "reputationScore";

    /** Hướng sắp xếp: "DESC" hoặc "ASC" (mặc định: "DESC") */
    @Builder.Default
    private String sortDirection = "DESC";
}
