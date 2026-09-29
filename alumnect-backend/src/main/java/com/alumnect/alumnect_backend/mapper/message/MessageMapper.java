package com.alumnect.alumnect_backend.mapper.message;

import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageAttachmentResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.dto.response.message.ParticipantResponse;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.message.MessageAttachment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp Mapper chuyển đổi giữa Entity và DTO cho chức năng Tin nhắn (trực tiếp 1-1, nhóm chat, người lạ).
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
                .type(message.getType() != null ? message.getType() : MessageType.TEXT)
                .isDeleted(message.isDeleted())
                .createdAt(message.getCreatedAt())
                .attachments(attachments)
                .build();
    }

    /**
     * Chuyển đổi Conversation 1-1 sang ConversationResponse tóm tắt cho danh sách chat.
     */
    public ConversationResponse toConversationResponse(
            Conversation conversation,
            User recipient,
            UserProfile recipientProfile,
            String lastMessageSnippet,
            long unreadCount,
            boolean isAccepted) {

        if (conversation == null) return null;

        boolean isGroup = conversation.getType() == ConversationType.GROUP;

        String title;
        String avatarUrl;
        String recipientName = null;
        String recipientAvatar = null;
        String recipientMajor = null;
        Long recipientId = null;

        if (isGroup) {
            title = conversation.getTitle() != null ? conversation.getTitle() : "Nhóm trò chuyện";
            avatarUrl = conversation.getAvatarUrl();
            recipientName = title;
            recipientAvatar = avatarUrl;
        } else {
            recipientId = recipient != null ? recipient.getId() : null;
            recipientName = recipientProfile != null && recipientProfile.getFullName() != null
                    ? recipientProfile.getFullName()
                    : (recipient != null ? recipient.getEmail() : "Người dùng");
            recipientAvatar = recipientProfile != null ? recipientProfile.getAvatarUrl() : null;
            recipientMajor = recipientProfile != null && recipientProfile.getMajor() != null
                    ? recipientProfile.getMajor().getName()
                    : null;
            title = recipientName;
            avatarUrl = recipientAvatar;
        }

        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .isGroup(isGroup)
                .title(title)
                .avatarUrl(avatarUrl)
                .createdAt(conversation.getCreatedAt())
                .lastMessageAt(conversation.getLastMessageAt() != null ? conversation.getLastMessageAt() : conversation.getCreatedAt())
                .recipientId(recipientId)
                .recipientName(recipientName)
                .recipientAvatar(recipientAvatar)
                .recipientMajor(recipientMajor)
                .memberCount(conversation.getParticipants() != null ? conversation.getParticipants().size() : 2)
                .isAccepted(isAccepted)
                .adminId(conversation.getCreatedBy() != null ? conversation.getCreatedBy().getId() : null)
                .lastMessage(lastMessageSnippet)
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * Chuyển đổi ConversationParticipant sang ParticipantResponse.
     */
    public ParticipantResponse toParticipantResponse(ConversationParticipant cp, UserProfile profile) {
        if (cp == null) return null;
        User user = cp.getUser();
        String fullName = profile != null && profile.getFullName() != null
                ? profile.getFullName()
                : (user != null ? user.getEmail() : "Thành viên");
        String avatar = profile != null ? profile.getAvatarUrl() : null;
        String major = profile != null && profile.getMajor() != null ? profile.getMajor().getName() : null;

        return ParticipantResponse.builder()
                .userId(user != null ? user.getId() : null)
                .fullName(fullName)
                .avatar(avatar)
                .major(major)
                .role(cp.getRole())
                .joinedAt(cp.getJoinedAt())
                .build();
    }
}
