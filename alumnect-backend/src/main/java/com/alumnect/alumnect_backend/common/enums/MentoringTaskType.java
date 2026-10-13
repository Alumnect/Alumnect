package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại hình nhiệm vụ / công việc mà Mentor đồng hành cùng Student.
 * - Yêu cầu Mentoring (UC100): lưu trong cột task_type của bảng mentoring_requests
 *   (CAREER_ORIENTATION, RESUME_REVIEW, MOCK_INTERVIEW, TECHNICAL_CONSULTING, CAPSTONE_ADVICE, OTHER).
 * - Mentoring Deal / Task (UC104, UC105): lưu trong cột task_type của bảng mentoring_deals, mentoring_tasks
 *   (CONSULTATION, ASSIGNMENT_GUIDANCE, PROJECT_MENTORING, RESUME_REVIEW, MOCK_INTERVIEW, SKILL_TRAINING, OTHER).
 */
public enum MentoringTaskType {
    /** Định hướng nghề nghiệp và lộ trình phát triển (UC100) */
    CAREER_ORIENTATION,

    /** Tư vấn kỹ thuật chuyên sâu và giải quyết vấn đề công nghệ (UC100) */
    TECHNICAL_CONSULTING,

    /** Hướng dẫn và cố vấn làm đồ án tốt nghiệp - Capstone Project (UC100) */
    CAPSTONE_ADVICE,

    /** Tư vấn định hướng học tập & nghề nghiệp (UC104) */
    CONSULTATION,

    /** Hướng dẫn thực hiện bài tập lớn / đồ án tốt nghiệp (UC104) */
    ASSIGNMENT_GUIDANCE,

    /** Cố vấn thực chiến dự án phần mềm / nghiên cứu (UC104) */
    PROJECT_MENTORING,

    /** Đánh giá, chỉnh sửa CV và hồ sơ xin việc */
    RESUME_REVIEW,

    /** Phỏng vấn thử việc (Mock Interview) */
    MOCK_INTERVIEW,

    /** Đào tạo kỹ năng chuyên sâu / công nghệ mới (UC104) */
    SKILL_TRAINING,

    /** Các nhu cầu hỗ trợ / loại hình nhiệm vụ khác */
    OTHER
}
