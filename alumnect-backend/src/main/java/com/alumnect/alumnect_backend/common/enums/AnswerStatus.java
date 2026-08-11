package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của một câu trả lời trên diễn đàn Q&A (UC41 - Answer a question).
 * Chỉ các câu trả lời {@link #ACTIVE} mới được hiển thị dưới câu hỏi;
 * {@link #HIDDEN} (bị Admin ẩn) và {@link #DELETED} (đã xóa mềm) không được liệt kê.
 */
public enum AnswerStatus {
    /** Đang hiển thị công khai dưới câu hỏi. */
    ACTIVE,
    /** Bị quản trị viên ẩn khỏi danh sách (không xóa cứng dữ liệu). */
    HIDDEN,
    /** Đã bị xóa mềm bởi tác giả hoặc quản trị viên. */
    DELETED
}
