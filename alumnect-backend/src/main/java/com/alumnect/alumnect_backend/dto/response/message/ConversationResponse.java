package com.alumnect.alumnect_backend.dto.response.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * DTO phản hồi thông tin tóm tắt cuộc hội thoại trong danh sách tin nhắn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    /** Mã cuộc hội thoại */
    private Long id;

    /** Thời điểm khởi tạo cuộc hội thoại */
    private Instant createdAt;

    /** Thời điểm phát sinh tin nhắn mới nhất */
    private Instant lastMessageAt;

    /** Mã người dùng đối phương trong cuộc hội thoại 1-1 */
    private Long recipientId;

    /** Họ tên người dùng đối phương */
    private String recipientName;

    /** Ảnh đại diện người dùng đối phương */
    private String recipientAvatar;

    /** Tên chuyên ngành của người dùng đối phương (nếu có) */
    private String recipientMajor;

    /** Nội dung tin nhắn tóm tắt gần nhất */
    private String lastMessage;

    /** Số lượng tin nhắn chưa đọc */
    private long unreadCount;
}
