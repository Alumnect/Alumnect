package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại hình nhiệm vụ / mục tiêu mà sinh viên cần Mentor hỗ trợ (UC100).
 * Được lưu trong cột task_type của bảng mentoring_requests.
 */
public enum MentoringTaskType {
    /** Định hướng nghề nghiệp và lộ trình phát triển */
    CAREER_ORIENTATION,

    /** Góp ý và tối ưu hóa hồ sơ năng lực / CV */
    RESUME_REVIEW,

    /** Phỏng vấn thử và rèn luyện kỹ năng trả lời phỏng vấn */
    MOCK_INTERVIEW,

    /** Tư vấn kỹ thuật chuyên sâu và giải quyết vấn đề công nghệ */
    TECHNICAL_CONSULTING,

    /** Hướng dẫn và cố vấn làm đồ án tốt nghiệp (Capstone Project) */
    CAPSTONE_ADVICE,

    /** Các nhu cầu hỗ trợ khác */
    OTHER
}
