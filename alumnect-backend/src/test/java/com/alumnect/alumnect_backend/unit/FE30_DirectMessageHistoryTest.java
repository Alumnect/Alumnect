package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MediaType;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageAttachmentRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.message.AttachmentRequest;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-30 Send a Direct Message & Chat History.
 * Report sheet : FE-30 (Report5_Unit_Test.xlsx)
 * Functions    : ChatServiceImpl.getMessages(), sendMessage(), markAsRead()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-30 Send a Direct Message & Chat History")
class FE30_DirectMessageHistoryTest {

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
    private static final String SENDER_EMAIL = "sender@example.com";
    private static final Long SENDER_ID = 1L;
    private static final Long BOB_ID = 2L;
    private static final Long CONVERSATION_ID = 10L;

    private User sender;
    private User bob;
    private UserProfile senderProfile;
    private Conversation conversation;
    private ConversationParticipant senderPart;
    private ConversationParticipant bobPart;

    @BeforeEach
    void setUp() {
        sender = User.builder()
                .id(SENDER_ID)
                .email(SENDER_EMAIL)
                .build();

        bob = User.builder()
                .id(BOB_ID)
                .email("bob@example.com")
                .build();

        senderProfile = UserProfile.builder()
                .userId(SENDER_ID)
                .fullName("Sender User")
                .avatarUrl("https://example.com/sender.png")
                .build();

        conversation = Conversation.builder()
                .id(CONVERSATION_ID)
                .type(ConversationType.DIRECT)
                .directKey("1_2")
                .createdAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .lastMessageAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();

        senderPart = ConversationParticipant.builder()
                .id(101L)
                .conversation(conversation)
                .user(sender)
                .isAccepted(true)
                .joinedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();

        bobPart = ConversationParticipant.builder()
                .id(102L)
                .conversation(conversation)
                .user(bob)
                .isAccepted(true)
                .joinedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();
    }

    // ================= getMessages() =================

    @Test
    @DisplayName("UTCID01 - User is participant of conversation -> Returns PageResponse with messages")
    void utcid01_getMessages_ok() {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Message msg1 = Message.builder()
                .id(1001L)
                .conversation(conversation)
                .sender(bob)
                .content("Hello")
                .attachments(Collections.emptyList())
                .createdAt(Instant.now())
                .build();
        Message msg2 = Message.builder()
                .id(1002L)
                .conversation(conversation)
                .sender(sender)
                .content("Hi Bob")
                .attachments(Collections.emptyList())
                .createdAt(Instant.now().minus(5, ChronoUnit.MINUTES))
                .build();

        Page<Message> messagePage = new PageImpl<>(List.of(msg1, msg2), pageable, 2);

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(messageRepository.findByConversationIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                CONVERSATION_ID, senderPart.getJoinedAt(), pageable))
                .thenReturn(messagePage);
        when(userProfileRepository.findAllById(Set.of(BOB_ID, SENDER_ID)))
                .thenReturn(List.of(senderProfile));

        // When
        PageResponse<MessageResponse> response = chatService.getMessages(SENDER_EMAIL, CONVERSATION_ID, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        assertThat(response.getContent().get(0).getContent()).isEqualTo("Hello");
        assertThat(response.getContent().get(1).getContent()).isEqualTo("Hi Bob");
    }

    @Test
    @DisplayName("UTCID02 - User is not a participant -> ForbiddenException")
    void utcid02_getMessages_forbidden() {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.getMessages(SENDER_EMAIL, CONVERSATION_ID, pageable))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền xem tin nhắn trong cuộc hội thoại này.");
    }

    // ================= sendMessage() =================

    @Test
    @DisplayName("UTCID03 - Participant sends text message -> Message saved trimmed and pushed via WebSocket to Bob")
    void utcid03_sendMessage_okTrimmedText() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(CONVERSATION_ID)
                .content("  Hi Bob  ")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        assertThat(msgCaptor.getValue().getContent()).isEqualTo("Hi Bob");
        assertThat(msgCaptor.getValue().getType()).isEqualTo(MessageType.TEXT);

        verify(conversationRepository).save(conversation);
        verify(messagingTemplate).convertAndSendToUser(
                eq(BOB_ID.toString()),
                eq(WebSocketDestinations.USER_QUEUE_MESSAGES),
                any(MessageResponse.class)
        );
        verify(messagingTemplate, never()).convertAndSendToUser(
                eq(SENDER_ID.toString()),
                anyString(),
                any()
        );
    }

    @Test
    @DisplayName("UTCID04 - No conversation and Bob follows sender -> New direct conv with Bob isAccepted true")
    void utcid04_sendMessage_okNewConvFollowed() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .recipientId(BOB_ID)
                .content("Hello")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(userRepository.findById(BOB_ID)).thenReturn(Optional.of(bob));
        when(conversationRepository.findByDirectKey("1_2")).thenReturn(Optional.empty());
        when(followRepository.existsByFollowerIdAndFollowingId(BOB_ID, SENDER_ID)).thenReturn(true);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<List<ConversationParticipant>> captor = ArgumentCaptor.forClass(List.class);
        verify(conversationParticipantRepository).saveAll(captor.capture());
        List<ConversationParticipant> savedParts = captor.getValue();
        assertThat(savedParts).hasSize(2);
        ConversationParticipant savedBobPart = savedParts.stream()
                .filter(p -> p.getUser().getId().equals(BOB_ID))
                .findFirst().orElseThrow();
        assertThat(savedBobPart.isAccepted()).isTrue();
    }

    @Test
    @DisplayName("UTCID05 - No conversation and stranger -> Bob participant isAccepted false (message request)")
    void utcid05_sendMessage_okNewConvStranger() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .recipientId(BOB_ID)
                .content("Hello")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(userRepository.findById(BOB_ID)).thenReturn(Optional.of(bob));
        when(conversationRepository.findByDirectKey("1_2")).thenReturn(Optional.empty());
        when(followRepository.existsByFollowerIdAndFollowingId(BOB_ID, SENDER_ID)).thenReturn(false);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<List<ConversationParticipant>> captor = ArgumentCaptor.forClass(List.class);
        verify(conversationParticipantRepository).saveAll(captor.capture());
        List<ConversationParticipant> savedParts = captor.getValue();
        ConversationParticipant savedBobPart = savedParts.stream()
                .filter(p -> p.getUser().getId().equals(BOB_ID))
                .findFirst().orElseThrow();
        assertThat(savedBobPart.isAccepted()).isFalse();

        ConversationParticipant savedSenderPart = savedParts.stream()
                .filter(p -> p.getUser().getId().equals(SENDER_ID))
                .findFirst().orElseThrow();
        assertThat(savedSenderPart.isAccepted()).isTrue();
    }

    @Test
    @DisplayName("UTCID06 - Content and attachments are null -> BadRequestException")
    void utcid06_sendMessage_badRequestNull() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .content(null)
                .attachments(null)
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tin nhắn phải có nội dung văn bản hoặc ít nhất một tệp đính kèm.");
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Content is blank and empty attachments -> BadRequestException")
    void utcid07_sendMessage_badRequestBlank() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .content("   ")
                .attachments(Collections.emptyList())
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tin nhắn phải có nội dung văn bản hoặc ít nhất một tệp đính kèm.");
    }

    @Test
    @DisplayName("UTCID08 - Neither conversationId nor recipientId provided -> BadRequestException")
    void utcid08_sendMessage_badRequestNoTarget() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .content("Hi")
                .conversationId(null)
                .recipientId(null)
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng cung cấp mã cuộc hội thoại hoặc mã người nhận.");
    }

    @Test
    @DisplayName("UTCID09 - Recipient is own id -> BadRequestException")
    void utcid09_sendMessage_badRequestSelf() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .recipientId(SENDER_ID)
                .content("Self message")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn không thể gửi tin nhắn cho chính mình.");
    }

    @Test
    @DisplayName("UTCID10 - Recipient 404 does not exist -> ResourceNotFoundException")
    void utcid10_sendMessage_notFoundRecipient() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .recipientId(404L)
                .content("Hello")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người nhận với mã: 404");
    }

    @Test
    @DisplayName("UTCID11 - Conversation 99 does not exist -> ResourceNotFoundException")
    void utcid11_sendMessage_notFoundConv() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(99L)
                .content("Hello")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy cuộc hội thoại với mã: 99");
    }

    @Test
    @DisplayName("UTCID12 - Sender is not participant of conversation 10 -> ForbiddenException")
    void utcid12_sendMessage_forbiddenNotMember() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(CONVERSATION_ID)
                .content("Hello")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> chatService.sendMessage(SENDER_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không phải là thành viên của cuộc hội thoại này.");
    }

    @Test
    @DisplayName("UTCID13 - Only image attachments -> Message type IMAGE and attachments saved")
    void utcid13_sendMessage_okImageAttachments() {
        // Given
        AttachmentRequest att1 = AttachmentRequest.builder()
                .mediaType(MediaType.IMAGE)
                .url("https://example.com/a.png")
                .fileName("a.png")
                .fileSize(1024L)
                .build();
        AttachmentRequest att2 = AttachmentRequest.builder()
                .mediaType(MediaType.IMAGE)
                .url("https://example.com/b.png")
                .fileName("b.png")
                .fileSize(2048L)
                .build();

        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(CONVERSATION_ID)
                .content(null)
                .attachments(List.of(att1, att2))
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            m.setAttachments(new ArrayList<>());
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        assertThat(msgCaptor.getValue().getType()).isEqualTo(MessageType.IMAGE);

        ArgumentCaptor<List<MessageAttachment>> attCaptor = ArgumentCaptor.forClass(List.class);
        verify(messageAttachmentRepository).saveAll(attCaptor.capture());
        assertThat(attCaptor.getValue()).hasSize(2);
    }

    @Test
    @DisplayName("UTCID14 - Mixed image and file attachments -> Message type FILE")
    void utcid14_sendMessage_okFileAttachments() {
        // Given
        AttachmentRequest att1 = AttachmentRequest.builder()
                .mediaType(MediaType.IMAGE)
                .url("https://example.com/a.png")
                .fileName("a.png")
                .fileSize(1024L)
                .build();
        AttachmentRequest att2 = AttachmentRequest.builder()
                .mediaType(MediaType.FILE)
                .url("https://example.com/doc.pdf")
                .fileName("doc.pdf")
                .fileSize(4096L)
                .build();

        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(CONVERSATION_ID)
                .content(null)
                .attachments(List.of(att1, att2))
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            m.setAttachments(new ArrayList<>());
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        assertThat(msgCaptor.getValue().getType()).isEqualTo(MessageType.FILE);
    }

    @Test
    @DisplayName("UTCID15 - Replying to pending request -> Auto accepts participant and updates lastReadMessage")
    void utcid15_sendMessage_okAutoAcceptPending() {
        // Given
        senderPart.setAccepted(false);
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(CONVERSATION_ID)
                .content("Thanks")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        verify(conversationParticipantRepository).save(senderPart);
        assertThat(senderPart.isAccepted()).isTrue();
        assertThat(senderPart.getLastReadMessage()).isNotNull();
        assertThat(senderPart.getLastReadMessage().getContent()).isEqualTo("Thanks");
    }

    @Test
    @DisplayName("UTCID16 - WebSocket push fails -> Exception caught and logged, message saved")
    void utcid16_sendMessage_exceptionWebSocketSwallowed() {
        // Given
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(CONVERSATION_ID)
                .content("Hi")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> {
            Message m = i.getArgument(0);
            m.setId(1001L);
            return m;
        });
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(userProfileRepository.findById(SENDER_ID)).thenReturn(Optional.of(senderProfile));
        when(conversationParticipantRepository.findByConversationId(CONVERSATION_ID))
                .thenReturn(List.of(senderPart, bobPart));

        doThrow(new RuntimeException("WebSocket server offline"))
                .when(messagingTemplate)
                .convertAndSendToUser(eq(BOB_ID.toString()), anyString(), any(MessageResponse.class));

        // When
        MessageResponse response = chatService.sendMessage(SENDER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        verify(messageRepository).save(any(Message.class));
    }

    // ================= markAsRead() =================

    @Test
    @DisplayName("UTCID17 - Mark as read with latest message -> participant lastReadMessage updated and saved")
    void utcid17_markAsRead_ok() {
        // Given
        Message latestMsg = Message.builder()
                .id(1005L)
                .conversation(conversation)
                .sender(bob)
                .content("Latest message")
                .build();

        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.of(senderPart));
        when(messageRepository.findTopByConversationIdOrderByCreatedAtDesc(CONVERSATION_ID))
                .thenReturn(Optional.of(latestMsg));

        // When
        chatService.markAsRead(SENDER_EMAIL, CONVERSATION_ID);

        // Then
        ArgumentCaptor<ConversationParticipant> captor = ArgumentCaptor.forClass(ConversationParticipant.class);
        verify(conversationParticipantRepository).save(captor.capture());
        assertThat(captor.getValue().getLastReadMessage()).isEqualTo(latestMsg);
    }

    @Test
    @DisplayName("UTCID18 - User is not a participant -> ForbiddenException")
    void utcid18_markAsRead_forbidden() {
        // Given
        when(userRepository.findByEmail(SENDER_EMAIL)).thenReturn(Optional.of(sender));
        when(conversationParticipantRepository.findByConversationIdAndUserId(CONVERSATION_ID, SENDER_ID))
                .thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.markAsRead(SENDER_EMAIL, CONVERSATION_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không phải thành viên của cuộc hội thoại này.");
        verify(conversationParticipantRepository, never()).save(any());
    }
}
