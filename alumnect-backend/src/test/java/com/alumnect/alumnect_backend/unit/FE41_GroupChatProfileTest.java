package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.common.enums.ParticipantRole;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageAttachmentRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.message.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.message.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.message.MessageMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.message.ChatServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-41 Group Chat - Create & Update Group Profile")
public class FE41_GroupChatProfileTest {

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

    @InjectMocks
    private ChatServiceImpl chatService;

    private Validator validator;

    private static final String CREATOR_EMAIL = "creator@fpt.edu.vn";
    private static final String MEMBER_EMAIL = "member@fpt.edu.vn";

    private User creatorUser;
    private User member2;
    private User member3;
    private UserProfile creatorProfile;
    private Conversation groupConversation;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();

        creatorUser = User.builder()
                .id(1L)
                .email(CREATOR_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        member2 = User.builder()
                .id(2L)
                .email(MEMBER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        member3 = User.builder()
                .id(3L)
                .email("user3@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        creatorProfile = UserProfile.builder()
                .userId(1L)
                .fullName("Nguyen Van Creator")
                .avatarUrl("https://example.com/avatar.png")
                .build();

        groupConversation = Conversation.builder()
                .id(100L)
                .type(ConversationType.GROUP)
                .title("Team A")
                .avatarUrl("https://example.com/team.png")
                .createdBy(creatorUser)
                .createdAt(Instant.now().minusSeconds(500))
                .lastMessageAt(Instant.now().minusSeconds(500))
                .build();
    }

    // ================= Create Group (UTCID01 - UTCID07) =================

    @Test
    @DisplayName("UTCID01 - CreateGroupRequest(title='Team A', memberIds=[2,3]) -> Creator is ADMIN, 2 MEMBER participants, system message saved")
    void utcid01_createGroup_okAdminAndMembers() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title("Team A")
                .avatarUrl("https://example.com/team.png")
                .memberIds(List.of(2L, 3L))
                .build();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(userRepository.findAllById(List.of(2L, 3L))).thenReturn(List.of(member2, member3));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> {
            Conversation c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(creatorProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(200L);
            m.setCreatedAt(Instant.now());
            return m;
        });

        // When
        ConversationResponse response = chatService.createGroupConversation(CREATOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getType()).isEqualTo(ConversationType.GROUP);
        assertThat(response.isGroup()).isTrue();
        assertThat(response.getTitle()).isEqualTo("Team A");
        assertThat(response.getMemberCount()).isEqualTo(3);
        assertThat(response.getAdminId()).isEqualTo(1L);

        ArgumentCaptor<List<ConversationParticipant>> partCaptor = ArgumentCaptor.forClass(List.class);
        verify(conversationParticipantRepository).saveAll(partCaptor.capture());
        List<ConversationParticipant> participants = partCaptor.getValue();
        assertThat(participants).hasSize(3);

        ConversationParticipant adminPart = participants.stream()
                .filter(p -> p.getUser().getId().equals(1L))
                .findFirst()
                .orElse(null);
        assertThat(adminPart).isNotNull();
        assertThat(adminPart.getRole()).isEqualTo(ParticipantRole.ADMIN);

        List<ConversationParticipant> memberParts = participants.stream()
                .filter(p -> !p.getUser().getId().equals(1L))
                .toList();
        assertThat(memberParts).hasSize(2);
        assertThat(memberParts).allMatch(p -> p.getRole() == ParticipantRole.MEMBER);

        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        Message initMsg = msgCaptor.getValue();
        assertThat(initMsg.getType()).isEqualTo(MessageType.SYSTEM);
        assertThat(initMsg.getContent()).contains("Team A");
    }

    @Test
    @DisplayName("UTCID02 - memberIds=[1,2] (1 = creator) -> Creator is not duplicated in the participant list")
    void utcid02_createGroup_okDeduplicateCreator() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title("Team A")
                .memberIds(List.of(1L, 2L))
                .build();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(member2));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> {
            Conversation c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(creatorProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(200L);
            m.setCreatedAt(Instant.now());
            return m;
        });

        // When
        ConversationResponse response = chatService.createGroupConversation(CREATOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMemberCount()).isEqualTo(2);

        ArgumentCaptor<List<ConversationParticipant>> partCaptor = ArgumentCaptor.forClass(List.class);
        verify(conversationParticipantRepository).saveAll(partCaptor.capture());
        List<ConversationParticipant> participants = partCaptor.getValue();
        assertThat(participants).hasSize(2);
        long creatorCount = participants.stream().filter(p -> p.getUser().getId().equals(1L)).count();
        assertThat(creatorCount).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID03 - title with 1 character -> Group created successfully")
    void utcid03_createGroup_okTitleMinLength1() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title("T")
                .memberIds(List.of(2L))
                .build();

        Set<ConstraintViolation<CreateGroupRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(member2));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> {
            Conversation c = inv.getArgument(0);
            c.setId(101L);
            return c;
        });
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(creatorProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(201L);
            m.setCreatedAt(Instant.now());
            return m;
        });

        // When
        ConversationResponse response = chatService.createGroupConversation(CREATOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("T");
    }

    @Test
    @DisplayName("UTCID04 - title with 100 characters -> Group created successfully")
    void utcid04_createGroup_okTitleMaxLength100() {
        // Given
        String maxTitle = "a".repeat(100);
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title(maxTitle)
                .memberIds(List.of(2L))
                .build();

        Set<ConstraintViolation<CreateGroupRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(member2));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> {
            Conversation c = inv.getArgument(0);
            c.setId(102L);
            return c;
        });
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(creatorProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(202L);
            m.setCreatedAt(Instant.now());
            return m;
        });

        // When
        ConversationResponse response = chatService.createGroupConversation(CREATOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo(maxTitle);
    }

    @Test
    @DisplayName("UTCID05 - title with 101 characters -> Validation error: title must be 1-100 characters")
    void utcid05_createGroup_invalidTitleTooLong() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title("a".repeat(101))
                .memberIds(List.of(2L))
                .build();

        // When
        Set<ConstraintViolation<CreateGroupRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Tên nhóm phải từ 1 đến 100 ký tự"));
    }

    @Test
    @DisplayName("UTCID06 - memberIds = [] (empty) -> Validation error: memberIds must not be empty")
    void utcid06_createGroup_invalidEmptyMembers() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title("Team A")
                .memberIds(Collections.emptyList())
                .build();

        // When
        Set<ConstraintViolation<CreateGroupRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Nhóm phải có ít nhất 1 thành viên khác"));
    }

    @Test
    @DisplayName("UTCID07 - memberIds=[99] does not exist -> BadRequestException: Không tìm thấy các thành viên được chọn.")
    void utcid07_createGroup_badReqUserNotFound() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .title("Team A")
                .memberIds(List.of(99L))
                .build();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(userRepository.findAllById(List.of(99L))).thenReturn(Collections.emptyList());

        // When + Then
        assertThatThrownBy(() -> chatService.createGroupConversation(CREATOR_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Không tìm thấy các thành viên được chọn.");
        verify(conversationRepository, never()).save(any());
    }

    // ================= Update Group (UTCID08 - UTCID10) =================

    @Test
    @DisplayName("UTCID08 - Group exists; caller is group ADMIN -> Group updated and system message posted")
    void utcid08_updateGroup_okAdminPostsSystemMsg() {
        // Given
        UpdateGroupRequest request = UpdateGroupRequest.builder()
                .title("New name")
                .avatarUrl("https://example.com/new.png")
                .build();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(100L, creatorUser.getId())).thenReturn(true);
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(creatorProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(300L);
            m.setCreatedAt(Instant.now());
            return m;
        });
        when(conversationParticipantRepository.findByConversationId(100L)).thenReturn(Collections.emptyList());
        when(conversationParticipantRepository.countByConversationId(100L)).thenReturn(3L);

        // When
        ConversationResponse response = chatService.updateGroup(CREATOR_EMAIL, 100L, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("New name");
        assertThat(response.getAvatarUrl()).isEqualTo("https://example.com/new.png");

        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        Message sysMsg = msgCaptor.getValue();
        assertThat(sysMsg.getType()).isEqualTo(MessageType.SYSTEM);
        assertThat(sysMsg.getContent()).contains("đã đổi tên nhóm thành \"New name\"");
    }

    @Test
    @DisplayName("UTCID09 - Group exists; caller is not authorized/member -> ForbiddenException")
    void utcid09_updateGroup_forbiddenNotAdmin() {
        // Given
        UpdateGroupRequest request = UpdateGroupRequest.builder()
                .title("New name")
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member2));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(100L, member2.getId())).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> chatService.updateGroup(MEMBER_EMAIL, 100L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không phải thành viên của nhóm này.");
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - Conversation is a DIRECT conversation -> BadRequestException: Cuộc hội thoại này không phải là nhóm trò chuyện.")
    void utcid10_updateGroup_badRequestNotGroup() {
        // Given
        Conversation directConversation = Conversation.builder()
                .id(200L)
                .type(ConversationType.DIRECT)
                .build();

        UpdateGroupRequest request = UpdateGroupRequest.builder()
                .title("x")
                .build();

        when(userRepository.findByEmail(CREATOR_EMAIL)).thenReturn(Optional.of(creatorUser));
        when(conversationRepository.findById(200L)).thenReturn(Optional.of(directConversation));

        // When + Then
        assertThatThrownBy(() -> chatService.updateGroup(CREATOR_EMAIL, 200L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cuộc hội thoại này không phải là nhóm trò chuyện.");
        verify(conversationParticipantRepository, never()).existsByConversationIdAndUserId(any(), any());
    }
}
