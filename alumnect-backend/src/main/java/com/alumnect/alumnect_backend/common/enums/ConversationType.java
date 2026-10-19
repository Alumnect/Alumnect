package com.alumnect.alumnect_backend.common.enums;

/**
 * Định nghĩa loại cuộc hội thoại: Trực tiếp 1-1, Nhắn tin nhóm hoặc Chat for Task của Mentoring.
 */
public enum ConversationType {
    /** Hội thoại trực tiếp 1-1 chung giữa hai người dùng */
    DIRECT,

    /** Nhóm trò chuyện */
    GROUP,

    /** Chat for Task: hội thoại 1-1 thuộc duy nhất bộ (Request, Student, Mentor) của luồng Mentoring */
    MENTORING
}
