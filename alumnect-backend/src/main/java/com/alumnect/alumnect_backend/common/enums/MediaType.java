package com.alumnect.alumnect_backend.common.enums;

/**
 * Định dạng tệp đính kèm trong tin nhắn (UC33 - Direct Messaging).
 * Tương ứng với ràng buộc CHECK trong bảng message_attachments: ('IMAGE', 'VIDEO', 'FILE').
 */
public enum MediaType {
    /** Tệp hình ảnh (jpg, png, webp, gif...) */
    IMAGE,

    /** Tệp video (mp4, webm, mov...) */
    VIDEO,

    /** Tệp tài liệu hoặc các định dạng khác (pdf, docx, zip...) */
    FILE
}
