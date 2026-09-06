package com.alumnect.alumnect_backend.dto.response.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO phản hồi thông tin chi tiết một tin nhắn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    /** Mã tin nhắn */
    private Long id;

    /** Mã cuộc hội thoại */
    private Long conversationId;

    /** Mã người gửi */
    private Long senderId;

    /** Họ tên người gửi */
    private String senderName;

    /** Ảnh đại diện người gửi */
    private String senderAvatar;

    /** Nội dung tin nhắn */
    private String content;

    /** Cờ đánh dấu tin nhắn bị xóa */
    private boolean isDeleted;

    /** Thời điểm gửi tin nhắn */
    private Instant createdAt;

    /** Danh sách tệp đính kèm */
    @Builder.Default
    private List<MessageAttachmentResponse> attachments = new ArrayList<>();
}
