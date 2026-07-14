package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của một câu hỏi trên diễn đàn Q&A (UC38 - View question list).
 * Bảng tin câu hỏi chỉ hiển thị các câu hỏi ở trạng thái {@link #ACTIVE};
 * {@link #HIDDEN} (bị Admin ẩn) và {@link #DELETED} (đã xóa mềm) không được liệt kê.
 */
public enum QuestionStatus {
    /** Đang hiển thị công khai trên diễn đàn. */
    ACTIVE,
    /** Bị quản trị viên ẩn khỏi danh sách (không xóa cứng dữ liệu). */
    HIDDEN,
    /** Đã bị xóa mềm bởi tác giả hoặc quản trị viên. */
    DELETED
}
