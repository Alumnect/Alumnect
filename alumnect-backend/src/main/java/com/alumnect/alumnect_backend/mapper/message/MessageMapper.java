package com.alumnect.alumnect_backend.mapper.message;

import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageAttachmentResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.message.MessageAttachment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp Mapper chuyển đổi giữa Entity và DTO cho chức năng Tin nhắn (UC33).
 */
@Component
public class MessageMapper {

    /**
     * Chuyển đổi MessageAttachment sang MessageAttachmentResponse.
     */
    public MessageAttachmentResponse toAttachmentResponse(MessageAttachment attachment) {
        if (attachment == null) return null;
        return MessageAttachmentResponse.builder()
                .id(attachment.getId())
                .mediaType(attachment.getMediaType())
                .url(attachment.getUrl())
                .fileName(attachment.getFileName())
                .fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    /**
     * Chuyển đổi Message sang MessageResponse đầy đủ thông tin người gửi và tệp đính kèm.
     */
    public MessageResponse toMessageResponse(Message message, UserProfile senderProfile) {
        if (message == null) return null;

        User sender = message.getSender();
        String senderName = senderProfile != null && senderProfile.getFullName() != null
                ? senderProfile.getFullName()
                : (sender != null ? sender.getEmail() : "Người dùng");
        String senderAvatar = senderProfile != null ? senderProfile.getAvatarUrl() : null;

        List<MessageAttachmentResponse> attachments = message.getAttachments() != null
                ? message.getAttachments().stream().map(this::toAttachmentResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .senderId(sender != null ? sender.getId() : null)
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .content(message.getContent())
                .isDeleted(message.isDeleted())
                .createdAt(message.getCreatedAt())
                .attachments(attachments)
                .build();
    }

    /**
     * Chuyển đổi Conversation sang ConversationResponse tóm tắt cho danh sách chat.
     */
    public ConversationResponse toConversationResponse(
            Conversation conversation,
            User recipient,
            UserProfile recipientProfile,
            String lastMessageSnippet,
            long unreadCount) {

        if (conversation == null) return null;

        String recipientName = recipientProfile != null && recipientProfile.getFullName() != null
                ? recipientProfile.getFullName()
                : (recipient != null ? recipient.getEmail() : "Người dùng");
        String recipientAvatar = recipientProfile != null ? recipientProfile.getAvatarUrl() : null;
        String recipientMajor = recipientProfile != null && recipientProfile.getMajor() != null
                ? recipientProfile.getMajor().getName()
                : null;

        return ConversationResponse.builder()
                .id(conversation.getId())
                .createdAt(conversation.getCreatedAt())
                .lastMessageAt(conversation.getLastMessageAt() != null ? conversation.getLastMessageAt() : conversation.getCreatedAt())
                .recipientId(recipient != null ? recipient.getId() : null)
                .recipientName(recipientName)
                .recipientAvatar(recipientAvatar)
                .recipientMajor(recipientMajor)
                .lastMessage(lastMessageSnippet)
                .unreadCount(unreadCount)
                .build();
    }
}
