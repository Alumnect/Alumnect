package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại đối tượng được bình chọn (UC42 - Vote on a question). Bảng {@code votes} dùng chung
 * cho cả câu hỏi lẫn câu trả lời (thiết kế đa hình theo blueprint), nhưng UC42 hiện chỉ triển
 * khai nghiệp vụ cho {@link #QUESTION}; {@link #ANSWER} để sẵn cho UC bình chọn câu trả lời sau này.
 */
public enum VoteTargetType {
    /** Bình chọn cho một câu hỏi. */
    QUESTION,
    /** Bình chọn cho một câu trả lời (chưa triển khai nghiệp vụ ở UC42). */
    ANSWER
}
