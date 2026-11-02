package com.alumnect.alumnect_backend.common.enums;

/**
 * Định nghĩa loại tin nhắn trong hệ thống hội thoại:
 * - TEXT: Tin nhắn văn bản người dùng thông thường
 * - SYSTEM: Thông báo sự kiện hệ thống (tạo nhóm, thêm/xóa/rời/đổi tên nhóm...)
 * - IMAGE: Tin nhắn chỉ gồm tệp hình ảnh
 * - FILE: Tin nhắn gồm tệp tài liệu
 */
public enum MessageType {
    TEXT,
    SYSTEM,
    IMAGE,
    FILE
}
