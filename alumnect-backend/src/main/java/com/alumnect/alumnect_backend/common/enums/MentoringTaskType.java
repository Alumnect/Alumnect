package com.alumnect.alumnect_backend.common.enums;

/**
 * Phân loại loại hình nhiệm vụ/công việc trong Mentoring Deal (UC104).
 * Xác định tính chất công việc học tập hoặc hướng nghiệp mà Mentor đồng hành cùng Student.
 */
public enum MentoringTaskType {
    /** Tư vấn định hướng học tập & nghề nghiệp */
    CONSULTATION,

    /** Hướng dẫn thực hiện bài tập lớn / đồ án tốt nghiệp */
    ASSIGNMENT_GUIDANCE,

    /** Cố vấn thực chiến dự án phần mềm / nghiên cứu */
    PROJECT_MENTORING,

    /** Đánh giá, chỉnh sửa CV và hồ sơ xin việc */
    RESUME_REVIEW,

    /** Phỏng vấn thử việc (Mock Interview) */
    MOCK_INTERVIEW,

    /** Đào tạo kỹ năng chuyên sâu / công nghệ mới */
    SKILL_TRAINING,

    /** Loại hình nhiệm vụ khác theo thỏa thuận */
    OTHER
}
