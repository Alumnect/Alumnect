package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MediaType;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageAttachmentRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserProjection;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserResponse;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.message.MessageAttachment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.message.MessageMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.message.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-29 View Conversation List (Inbox).
 * Report sheet : FE-29 (Report5_Unit_Test.xlsx)
 * Functions    : ChatServiceImpl.getConversations(), getOrCreateDirectConversation(),
 *                acceptConversation(), deleteConversation(), searchUsersForChat()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-29 View Conversation List (Inbox)")
class FE29_ConversationInboxTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository conversationParticipantRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageAttachmentRepository messageAttachmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private FollowRepository followRepository;

    @Spy
    private MessageMapper messageMapper = new MessageMapper();

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private MentoringConversationService mentoringConversationService;

    // ===== System under test =====
    @InjectMocks
    private ChatServiceImpl chatService;

    // ===== Test data =====
    private static final String CURRENT_USER_EMAIL = "current@example.com";
    private static final Long CURRENT_USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long CONVERSATION_ID = 10L;

    private User currentUser;
    private User otherUser;
    private UserProfile otherProfile;
    private Conversation directConversation;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id(CURRENT_USER_ID)
                .email(CURRENT_USER_EMAIL)
                .build();

        otherUser = User.builder()
                .id(OTHER_USER_ID)
                .email("other@example.com")
                .build();

        otherProfile = UserProfile.builder()
                .userId(OTHER_USER_ID)
                .fullName("Other User")
                .avatarUrl("https://example.com/avatar2.png")
                .build();

        directConversation = Conversation.builder()
                .id(CONVERSATION_ID)
                .type(ConversationType.DIRECT)
                .directKey("1_2")
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .build();
    }

    // ================= getConversations() =================

    @Test
    @DisplayName("UTCID01 - Accepted conversation with 3 unread -> ConversationResponse returned with unread count")
    void utcid01_getConversations_okPrimary() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(true)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .sender(otherUser)
                .content("Hello")
                .attachments(Collections.emptyList())
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(List.of(1001L));
        when(messageRepository.findMessagesWithAttachmentsByIdIn(List.of(1001L)))
                .thenReturn(List.of(msg));
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.singletonList(new Object[]{CONVERSATION_ID, 3L}));

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "primary", null);

        // Then
        assertThat(result).hasSize(1);
        ConversationResponse response = result.get(0);
        assertThat(response.getId()).isEqualTo(CONVERSATION_ID);
        assertThat(response.getLastMessage()).isEqualTo("Hello");
        assertThat(response.getUnreadCount()).isEqualTo(3L);
        assertThat(response.isAccepted()).isTrue();
    }

    @Test
    @DisplayName("UTCID02 - Pending request conversation -> Listed in requests tab")
    void utcid02_getConversations_okRequests() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(false)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .sender(otherUser)
                .content("Xin chào, kết bạn nhé")
                .attachments(Collections.emptyList())
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(List.of(1001L));
        when(messageRepository.findMessagesWithAttachmentsByIdIn(List.of(1001L)))
                .thenReturn(List.of(msg));
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.singletonList(new Object[]{CONVERSATION_ID, 1L}));

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "requests", null);

        // Then
        assertThat(result).hasSize(1);
        ConversationResponse response = result.get(0);
        assertThat(response.getId()).isEqualTo(CONVERSATION_ID);
        assertThat(response.isAccepted()).isFalse();
    }

    @Test
    @DisplayName("UTCID03 - Pending request conversation -> Hidden from primary tab")
    void utcid03_getConversations_okHiddenPrimary() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(false)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .sender(otherUser)
                .content("Xin chào")
                .attachments(Collections.emptyList())
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(List.of(1001L));
        when(messageRepository.findMessagesWithAttachmentsByIdIn(List.of(1001L)))
                .thenReturn(List.of(msg));
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.singletonList(new Object[]{CONVERSATION_ID, 1L}));

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "primary", null);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("UTCID04 - Conversation has no message -> Hidden from inbox")
    void utcid04_getConversations_okNoMessage() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(true)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.emptyList());
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.emptyList());

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, null, null);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("UTCID05 - User has no conversations -> Returns empty list")
    void utcid05_getConversations_okEmpty() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(Collections.emptyList());

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "primary", null);

        // Then
        assertThat(result).isEmpty();
        verify(conversationParticipantRepository, never()).findByConversationIdInWithUserAndLastRead(any());
        verify(messageRepository, never()).findLatestMessageIdsByConversationIds(any(), any());
    }

    @Test
    @DisplayName("UTCID06 - Last message has image attachment -> Preview text is [Hình ảnh]")
    void utcid06_getConversations_okImage() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(true)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        MessageAttachment attachment = MessageAttachment.builder()
                .id(501L)
                .mediaType(MediaType.IMAGE)
                .build();
        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .sender(otherUser)
                .content(null)
                .attachments(List.of(attachment))
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(List.of(1001L));
        when(messageRepository.findMessagesWithAttachmentsByIdIn(List.of(1001L)))
                .thenReturn(List.of(msg));
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.emptyList());

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "primary", null);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLastMessage()).isEqualTo("[Hình ảnh]");
    }

    @Test
    @DisplayName("UTCID07 - Last message has video attachment -> Preview text is [Video]")
    void utcid07_getConversations_okVideo() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(true)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        MessageAttachment attachment = MessageAttachment.builder()
                .id(502L)
                .mediaType(MediaType.VIDEO)
                .build();
        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .sender(otherUser)
                .content("")
                .attachments(List.of(attachment))
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(List.of(1001L));
        when(messageRepository.findMessagesWithAttachmentsByIdIn(List.of(1001L)))
                .thenReturn(List.of(msg));
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.emptyList());

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "primary", null);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLastMessage()).isEqualTo("[Video]");
    }

    @Test
    @DisplayName("UTCID08 - Last message has file attachment -> Preview text is [Tệp đính kèm]")
    void utcid08_getConversations_okFile() {
        // Given
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(true)
                .build();
        ConversationParticipant partOther = ConversationParticipant.builder()
                .id(102L)
                .conversation(directConversation)
                .user(otherUser)
                .isAccepted(true)
                .build();

        MessageAttachment attachment = MessageAttachment.builder()
                .id(503L)
                .mediaType(MediaType.FILE)
                .build();
        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .sender(otherUser)
                .content("  ")
                .attachments(List.of(attachment))
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findConversationsByUserId(CURRENT_USER_ID))
                .thenReturn(List.of(directConversation));
        when(conversationParticipantRepository.findByConversationIdInWithUserAndLastRead(List.of(CONVERSATION_ID)))
                .thenReturn(List.of(partCurrent, partOther));
        when(userProfileRepository.findAllById(Set.of(OTHER_USER_ID)))
                .thenReturn(List.of(otherProfile));
        when(messageRepository.findLatestMessageIdsByConversationIds(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(List.of(1001L));
        when(messageRepository.findMessagesWithAttachmentsByIdIn(List.of(1001L)))
                .thenReturn(List.of(msg));
        when(messageRepository.countUnreadGroupedByConversation(List.of(CONVERSATION_ID), CURRENT_USER_ID))
                .thenReturn(Collections.emptyList());

        // When
        List<ConversationResponse> result = chatService.getConversations(CURRENT_USER_EMAIL, "primary", null);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLastMessage()).isEqualTo("[Tệp đính kèm]");
    }

    // ================= getOrCreateDirectConversation() =================

    @Test
    @DisplayName("UTCID09 - Direct conversation exists -> Returns existing conversation")
    void utcid09_getOrCreateDirectConversation_ok() {
        // Given
        Message msg = Message.builder()
                .id(1001L)
                .conversation(directConversation)
                .content("Hello")
                .build();
        ConversationParticipant partCurrent = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(true)
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(OTHER_USER_ID)).thenReturn(Optional.of(otherUser));
        when(userProfileRepository.findById(OTHER_USER_ID)).thenReturn(Optional.of(otherProfile));
        when(conversationRepository.findByDirectKey("1_2")).thenReturn(Optional.of(directConversation));
        when(messageRepository.findTopByConversationIdOrderByCreatedAtDesc(CONVERSATION_ID)).thenReturn(Optional.of(msg));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, CURRENT_USER_ID))
                .thenReturn(Optional.of(partCurrent));

        // When
        ConversationResponse response = chatService.getOrCreateDirectConversation(CURRENT_USER_EMAIL, OTHER_USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(CONVERSATION_ID);
        assertThat(response.getRecipientId()).isEqualTo(OTHER_USER_ID);
        assertThat(response.getLastMessage()).isEqualTo("Hello");
        assertThat(response.isAccepted()).isTrue();
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - No existing conversation -> Returns draft conversation response")
    void utcid10_getOrCreateDirectConversation_okDraft() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(OTHER_USER_ID)).thenReturn(Optional.of(otherUser));
        when(userProfileRepository.findById(OTHER_USER_ID)).thenReturn(Optional.of(otherProfile));
        when(conversationRepository.findByDirectKey("1_2")).thenReturn(Optional.empty());
        when(conversationRepository.findDirectConversationBetween(CURRENT_USER_ID, OTHER_USER_ID))
                .thenReturn(Optional.empty());

        // When
        ConversationResponse response = chatService.getOrCreateDirectConversation(CURRENT_USER_EMAIL, OTHER_USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNull();
        assertThat(response.getRecipientId()).isEqualTo(OTHER_USER_ID);
        assertThat(response.getRecipientName()).isEqualTo("Other User");
        assertThat(response.getLastMessage()).isEqualTo("");
        verify(conversationRepository, never()).save(any());
        verify(conversationParticipantRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Target user is self -> BadRequestException")
    void utcid11_getOrCreateDirectConversation_badRequest() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));

        // When + Then
        assertThatThrownBy(() -> chatService.getOrCreateDirectConversation(CURRENT_USER_EMAIL, CURRENT_USER_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn không thể tạo cuộc trò chuyện với chính mình.");
        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("UTCID12 - Target user not found -> ResourceNotFoundException")
    void utcid12_getOrCreateDirectConversation_notFound() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.getOrCreateDirectConversation(CURRENT_USER_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với mã: 404");
    }

    @Test
    @DisplayName("UTCID13 - Target id smaller than current user -> DirectKey built with min_max")
    void utcid13_getOrCreateDirectConversation_okKeyOrder() {
        // Given
        User user5 = User.builder().id(5L).email("user5@example.com").build();
        User user3 = User.builder().id(3L).email("user3@example.com").build();
        UserProfile profile3 = UserProfile.builder().userId(3L).fullName("User Three").build();
        Conversation conv35 = Conversation.builder()
                .id(35L)
                .type(ConversationType.DIRECT)
                .directKey("3_5")
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail("user5@example.com")).thenReturn(Optional.of(user5));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user3));
        when(userProfileRepository.findById(3L)).thenReturn(Optional.of(profile3));
        when(conversationRepository.findByDirectKey("3_5")).thenReturn(Optional.of(conv35));
        when(messageRepository.findTopByConversationIdOrderByCreatedAtDesc(35L)).thenReturn(Optional.empty());
        when(conversationParticipantRepository.findByConversationIdAndUserId(35L, 5L)).thenReturn(Optional.empty());

        // When
        ConversationResponse response = chatService.getOrCreateDirectConversation("user5@example.com", 3L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(35L);
        assertThat(response.getRecipientId()).isEqualTo(3L);
        verify(conversationRepository).findByDirectKey("3_5");
    }

    // ================= acceptConversation() =================

    @Test
    @DisplayName("UTCID14 - Pending request -> Accepted and saved")
    void utcid14_acceptConversation_ok() {
        // Given
        ConversationParticipant participant = ConversationParticipant.builder()
                .id(101L)
                .conversation(directConversation)
                .user(currentUser)
                .isAccepted(false)
                .build();

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, CURRENT_USER_ID))
                .thenReturn(Optional.of(participant));

        // When
        chatService.acceptConversation(CURRENT_USER_EMAIL, CONVERSATION_ID);

        // Then
        ArgumentCaptor<ConversationParticipant> captor = ArgumentCaptor.forClass(ConversationParticipant.class);
        verify(conversationParticipantRepository).save(captor.capture());
        assertThat(captor.getValue().isAccepted()).isTrue();
    }

    @Test
    @DisplayName("UTCID15 - User not a participant -> ResourceNotFoundException")
    void utcid15_acceptConversation_notFound() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, CURRENT_USER_ID))
                .thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.acceptConversation(CURRENT_USER_EMAIL, CONVERSATION_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bạn không phải là thành viên của cuộc hội thoại này.");
        verify(conversationParticipantRepository, never()).save(any());
    }

    // ================= deleteConversation() =================

    @Test
    @DisplayName("UTCID16 - Participant of direct chat -> Conversation deleted")
    void utcid16_deleteConversation_ok() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(directConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, CURRENT_USER_ID))
                .thenReturn(true);

        // When
        chatService.deleteConversation(CURRENT_USER_EMAIL, CONVERSATION_ID);

        // Then
        verify(conversationRepository).delete(directConversation);
    }

    @Test
    @DisplayName("UTCID17 - User not a participant -> ForbiddenException")
    void utcid17_deleteConversation_forbidden() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(directConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, CURRENT_USER_ID))
                .thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> chatService.deleteConversation(CURRENT_USER_EMAIL, CONVERSATION_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền xóa cuộc hội thoại này.");
        verify(conversationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("UTCID18 - Conversation not found -> ResourceNotFoundException")
    void utcid18_deleteConversation_notFound() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.deleteConversation(CURRENT_USER_EMAIL, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy cuộc hội thoại.");
        verify(conversationRepository, never()).delete(any());
    }

    // ================= searchUsersForChat() =================

    @Test
    @DisplayName("UTCID19 - Native search with null isFollowing -> Mapped to false")
    void utcid19_searchUsersForChat_ok() {
        // Given
        ChatUserProjection proj1 = mock(ChatUserProjection.class);
        when(proj1.getUserId()).thenReturn(2L);
        when(proj1.getEmail()).thenReturn("user2@example.com");
        when(proj1.getFullName()).thenReturn("Nguyen Van A");
        when(proj1.getAvatarUrl()).thenReturn("https://avatar1.png");
        when(proj1.getHeadline()).thenReturn("Dev");
        when(proj1.getMajor()).thenReturn("SE");
        when(proj1.getIsFollowing()).thenReturn(Boolean.TRUE);

        ChatUserProjection proj2 = mock(ChatUserProjection.class);
        when(proj2.getUserId()).thenReturn(3L);
        when(proj2.getEmail()).thenReturn("user3@example.com");
        when(proj2.getFullName()).thenReturn("Nguyen Van B");
        when(proj2.getAvatarUrl()).thenReturn("https://avatar2.png");
        when(proj2.getHeadline()).thenReturn("QA");
        when(proj2.getMajor()).thenReturn("IS");
        when(proj2.getIsFollowing()).thenReturn(null);

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, "nguyen", "nguyen%", "% nguyen%", "nguyen%", 25))
                .thenReturn(List.of(proj1, proj2));

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "nguyen");

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUserId()).isEqualTo(2L);
        assertThat(result.get(0).isFollowing()).isTrue();
        assertThat(result.get(1).getUserId()).isEqualTo(3L);
        assertThat(result.get(1).isFollowing()).isFalse();
    }

    @Test
    @DisplayName("UTCID20 - Blank keyword -> Passes null keyword to native query")
    void utcid20_searchUsersForChat_okBlank() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, null, "%", "% %", "%", 25))
                .thenReturn(Collections.emptyList());

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "   ");

        // Then
        assertThat(result).isEmpty();
        verify(userProfileRepository).searchUsersForChatNative(CURRENT_USER_ID, null, "%", "% %", "%", 25);
    }

    @Test
    @DisplayName("UTCID21 - Accented keyword -> Generates unaccented patterns and query")
    void utcid21_searchUsersForChat_okAccented() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, "Nguyễn", "nguyen%", "% nguyen%", "nguyễn%", 25))
                .thenReturn(Collections.emptyList());

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "Nguyễn");

        // Then
        assertThat(result).isEmpty();
        verify(userProfileRepository).searchUsersForChatNative(
                CURRENT_USER_ID, "Nguyễn", "nguyen%", "% nguyen%", "nguyễn%", 25);
    }
}
