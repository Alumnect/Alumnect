package com.alumnect.alumnect_backend.dto.response.message;

import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    /** Loại cuộc hội thoại: DIRECT hoặc GROUP */
    @Builder.Default
    private ConversationType type = ConversationType.DIRECT;

    /** Cờ xác định đây có phải là nhóm hay không */
    @JsonProperty("isGroup")
    private boolean isGroup;

    /** Tiêu đề cuộc trò chuyện (Tên nhóm hoặc tên người nhận) */
    private String title;

    /** Ảnh đại diện (Ảnh nhóm hoặc ảnh người nhận) */
    private String avatarUrl;

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

    /** Số lượng thành viên (đối với cuộc hội thoại nhóm) */
    private int memberCount;

    /** Trạng thái đã chấp nhận tin nhắn (false nếu là tin nhắn chờ từ người lạ) */
    @Builder.Default
    private boolean isAccepted = true;

    /** Mã quản trị viên / người tạo nhóm */
    private Long adminId;

    /** Nội dung tin nhắn tóm tắt gần nhất */
    private String lastMessage;

    /** Số lượng tin nhắn chưa đọc */
    private long unreadCount;
}
