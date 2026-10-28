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
import com.alumnect.alumnect_backend.dto.request.message.AddMembersRequest;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.ParticipantResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-42 Group Chat - Manage Group Members")
public class FE42_GroupChatManageMembersTest {

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

    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final String MEMBER_EMAIL = "member@fpt.edu.vn";
    private static final Long GROUP_ID = 100L;

    private User adminUser;
    private User memberUser;
    private User user4;
    private User user5;
    private User ownerUser;
    private UserProfile adminProfile;
    private UserProfile memberProfile;
    private Conversation groupConversation;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();

        adminUser = User.builder()
                .id(1L)
                .email(ADMIN_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        memberUser = User.builder()
                .id(2L)
                .email(MEMBER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        user4 = User.builder()
                .id(4L)
                .email("user4@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        user5 = User.builder()
                .id(5L)
                .email("user5@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        ownerUser = User.builder()
                .id(10L)
                .email("owner@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        adminProfile = UserProfile.builder()
                .userId(1L)
                .fullName("Nguyen Admin")
                .build();

        memberProfile = UserProfile.builder()
                .userId(2L)
                .fullName("Tran Member")
                .build();

        groupConversation = Conversation.builder()
                .id(GROUP_ID)
                .type(ConversationType.GROUP)
                .title("Team Work")
                .createdBy(adminUser)
                .createdAt(Instant.now().minusSeconds(1000))
                .lastMessageAt(Instant.now().minusSeconds(1000))
                .build();
    }

    // ================= Add Members (UTCID01 - UTCID03) =================

    @Test
    @DisplayName("UTCID01 - Caller is group ADMIN; users 4,5 exist and not members -> 2 participants added and system message posted")
    void utcid01_addMembers_okAdminAddsTwo() {
        // Given
        AddMembersRequest request = AddMembersRequest.builder().memberIds(List.of(4L, 5L)).build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, adminUser.getId())).thenReturn(true);
        when(userRepository.findAllById(List.of(4L, 5L))).thenReturn(List.of(user4, user5));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, 4L)).thenReturn(false);
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, 5L)).thenReturn(false);
        when(userProfileRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminProfile));
        when(userProfileRepository.findAllById(List.of(4L, 5L))).thenReturn(Collections.emptyList());
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(301L);
            m.setCreatedAt(Instant.now());
            return m;
        });
        when(conversationParticipantRepository.findByConversationId(GROUP_ID)).thenReturn(Collections.emptyList());
        when(conversationParticipantRepository.countByConversationId(GROUP_ID)).thenReturn(4L);

        // When
        ConversationResponse response = chatService.addMembers(ADMIN_EMAIL, GROUP_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMemberCount()).isEqualTo(4);

        ArgumentCaptor<List<ConversationParticipant>> captor = ArgumentCaptor.forClass(List.class);
        verify(conversationParticipantRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue()).allMatch(p -> p.getRole() == ParticipantRole.MEMBER);

        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        assertThat(msgCaptor.getValue().getType()).isEqualTo(MessageType.SYSTEM);
        assertThat(msgCaptor.getValue().getContent()).contains("đã thêm");
    }

    @Test
    @DisplayName("UTCID02 - Caller is not in the group / not authorized -> ForbiddenException: Bạn không có quyền thêm thành viên vào nhóm này.")
    void utcid02_addMembers_forbiddenNotAdmin() {
        // Given
        AddMembersRequest request = AddMembersRequest.builder().memberIds(List.of(4L)).build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(memberUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, memberUser.getId())).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> chatService.addMembers(MEMBER_EMAIL, GROUP_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền thêm thành viên vào nhóm này.");
        verify(conversationParticipantRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("UTCID03 - User 4 is already a member -> Already existing member skipped; no duplicate participant")
    void utcid03_addMembers_okSkipExistingMember() {
        // Given
        AddMembersRequest request = AddMembersRequest.builder().memberIds(List.of(4L)).build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, adminUser.getId())).thenReturn(true);
        when(userRepository.findAllById(List.of(4L))).thenReturn(List.of(user4));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, 4L)).thenReturn(true);
        when(conversationParticipantRepository.countByConversationId(GROUP_ID)).thenReturn(2L);

        // When
        ConversationResponse response = chatService.addMembers(ADMIN_EMAIL, GROUP_ID, request);

        // Then
        assertThat(response).isNotNull();
        verify(conversationParticipantRepository, never()).saveAll(any());
        verify(messageRepository, never()).save(any());
    }

    // ================= Remove Member & Leave Group (UTCID04 - UTCID09) =================

    @Test
    @DisplayName("UTCID04 - Caller is ADMIN; target is MEMBER -> Participant removed and system message posted")
    void utcid04_removeMember_okAdminKicksMember() {
        // Given
        ConversationParticipant adminPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(adminUser)
                .role(ParticipantRole.ADMIN)
                .build();

        UserProfile targetProfile = UserProfile.builder().userId(2L).fullName("Tran Member").build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, adminUser.getId()))
                .thenReturn(Optional.of(adminPart));
        when(conversationParticipantRepository.countByConversationId(GROUP_ID)).thenReturn(2L);
        when(userProfileRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminProfile));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(targetProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(400L);
            m.setCreatedAt(Instant.now());
            return m;
        });
        when(conversationParticipantRepository.findByConversationId(GROUP_ID)).thenReturn(Collections.emptyList());

        // When
        chatService.removeMember(ADMIN_EMAIL, GROUP_ID, 2L, null);

        // Then
        verify(conversationParticipantRepository).deleteByConversationIdAndUserId(GROUP_ID, 2L);
        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        assertThat(msgCaptor.getValue().getContent()).contains("đã xóa Tran Member khỏi nhóm");
    }

    @Test
    @DisplayName("UTCID05 - Caller is MEMBER; target is another member -> ForbiddenException: Chỉ quản trị viên mới có quyền xóa thành viên khỏi nhóm.")
    void utcid05_removeMember_forbiddenNotAdmin() {
        // Given
        ConversationParticipant memberPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(memberUser)
                .role(ParticipantRole.MEMBER)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(memberUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, memberUser.getId()))
                .thenReturn(Optional.of(memberPart));

        // When + Then
        assertThatThrownBy(() -> chatService.removeMember(MEMBER_EMAIL, GROUP_ID, 4L, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ quản trị viên mới có quyền xóa thành viên khỏi nhóm.");
        verify(conversationParticipantRepository, never()).deleteByConversationIdAndUserId(any(), any());
    }

    @Test
    @DisplayName("UTCID06 - Caller is MEMBER -> Caller leaves the group and a system message is posted")
    void utcid06_removeMember_okMemberLeaves() {
        // Given
        ConversationParticipant memberPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(memberUser)
                .role(ParticipantRole.MEMBER)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(memberUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, memberUser.getId()))
                .thenReturn(Optional.of(memberPart));
        when(conversationParticipantRepository.countByConversationId(GROUP_ID)).thenReturn(2L);
        when(userProfileRepository.findById(memberUser.getId())).thenReturn(Optional.of(memberProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(401L);
            m.setCreatedAt(Instant.now());
            return m;
        });
        when(conversationParticipantRepository.findByConversationId(GROUP_ID)).thenReturn(Collections.emptyList());

        // When
        chatService.removeMember(MEMBER_EMAIL, GROUP_ID, 2L, null);

        // Then
        verify(conversationParticipantRepository).deleteByConversationIdAndUserId(GROUP_ID, 2L);
        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        assertThat(msgCaptor.getValue().getContent()).contains("đã rời nhóm");
    }

    @Test
    @DisplayName("UTCID07 - Caller is ADMIN with 2+ members -> Admin role transferred to specified next member")
    void utcid07_removeMember_okTransferAdmin() {
        // Given
        ConversationParticipant adminPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(adminUser)
                .role(ParticipantRole.ADMIN)
                .build();

        ConversationParticipant memberPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(memberUser)
                .role(ParticipantRole.MEMBER)
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, adminUser.getId()))
                .thenReturn(Optional.of(adminPart));
        when(conversationParticipantRepository.countByConversationId(GROUP_ID)).thenReturn(1L);
        when(conversationParticipantRepository.findByConversationId(GROUP_ID)).thenReturn(List.of(memberPart));
        when(userProfileRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminProfile));
        when(userProfileRepository.findById(memberUser.getId())).thenReturn(Optional.of(memberProfile));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(402L);
            m.setCreatedAt(Instant.now());
            return m;
        });

        // When
        chatService.removeMember(ADMIN_EMAIL, GROUP_ID, 1L, 2L);

        // Then
        assertThat(memberPart.getRole()).isEqualTo(ParticipantRole.ADMIN);
        verify(conversationParticipantRepository).save(memberPart);
        verify(conversationRepository, atLeastOnce()).save(groupConversation);
        assertThat(groupConversation.getCreatedBy()).isEqualTo(memberUser);
    }

    @Test
    @DisplayName("UTCID08 - Target is owner of linked community group -> BadRequestException: Không thể xóa Chủ sở hữu")
    void utcid08_removeMember_badReqRemoveOwner() {
        // Given
        CommunityGroup commGroup = CommunityGroup.builder().id(50L).owner(ownerUser).build();
        groupConversation.setCommunityGroup(commGroup);

        ConversationParticipant adminPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(adminUser)
                .role(ParticipantRole.ADMIN)
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, adminUser.getId()))
                .thenReturn(Optional.of(adminPart));

        // When + Then
        assertThatThrownBy(() -> chatService.removeMember(ADMIN_EMAIL, GROUP_ID, 10L, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Không thể xóa Chủ sở hữu của hội nhóm khỏi nhóm trò chuyện.");
        verify(conversationParticipantRepository, never()).deleteByConversationIdAndUserId(any(), any());
    }

    @Test
    @DisplayName("UTCID09 - Caller is the only participant -> Conversation is deleted automatically")
    void utcid09_removeMember_okAutoDeleteGroup() {
        // Given
        ConversationParticipant adminPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(adminUser)
                .role(ParticipantRole.ADMIN)
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, adminUser.getId()))
                .thenReturn(Optional.of(adminPart));
        when(conversationParticipantRepository.countByConversationId(GROUP_ID)).thenReturn(0L);

        // When
        chatService.removeMember(ADMIN_EMAIL, GROUP_ID, 1L, null);

        // Then
        verify(conversationParticipantRepository).deleteByConversationIdAndUserId(GROUP_ID, 1L);
        verify(conversationRepository).delete(groupConversation);
    }

    // ================= Dissolve Group (UTCID10 - UTCID11) =================

    @Test
    @DisplayName("UTCID10 - Caller is group ADMIN -> Group conversation deleted for all members")
    void utcid10_deleteConversation_okAdmin() {
        // Given
        groupConversation.setCreatedBy(adminUser);

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, adminUser.getId())).thenReturn(true);

        // When
        chatService.deleteConversation(ADMIN_EMAIL, GROUP_ID);

        // Then
        verify(conversationRepository).delete(groupConversation);
    }

    @Test
    @DisplayName("UTCID11 - Caller is MEMBER -> ForbiddenException: Chỉ Trưởng nhóm / Chủ sở hữu mới có quyền giải tán nhóm trò chuyện.")
    void utcid11_deleteConversation_forbidden() {
        // Given
        groupConversation.setCreatedBy(adminUser);
        ConversationParticipant memberPart = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(memberUser)
                .role(ParticipantRole.MEMBER)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(memberUser));
        when(conversationRepository.findById(GROUP_ID)).thenReturn(Optional.of(groupConversation));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, memberUser.getId())).thenReturn(true);
        when(conversationParticipantRepository.findByConversationIdAndUserId(GROUP_ID, memberUser.getId()))
                .thenReturn(Optional.of(memberPart));

        // When + Then
        assertThatThrownBy(() -> chatService.deleteConversation(MEMBER_EMAIL, GROUP_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ Trưởng nhóm / Chủ sở hữu mới có quyền giải tán nhóm trò chuyện.");
        verify(conversationRepository, never()).delete(any());
    }

    // ================= Get Group Members (UTCID12) =================

    @Test
    @DisplayName("UTCID12 - Caller is participant -> List of members with role returned")
    void utcid12_getGroupMembers_okListMembers() {
        // Given
        ConversationParticipant p1 = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(adminUser)
                .role(ParticipantRole.ADMIN)
                .build();

        ConversationParticipant p2 = ConversationParticipant.builder()
                .conversation(groupConversation)
                .user(memberUser)
                .role(ParticipantRole.MEMBER)
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(conversationParticipantRepository.existsByConversationIdAndUserId(GROUP_ID, adminUser.getId())).thenReturn(true);
        when(conversationParticipantRepository.findByConversationIdWithUser(GROUP_ID)).thenReturn(List.of(p1, p2));
        when(userProfileRepository.findAllById(anySet())).thenReturn(List.of(adminProfile, memberProfile));

        // When
        List<ParticipantResponse> responses = chatService.getGroupMembers(ADMIN_EMAIL, GROUP_ID);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getUserId()).isEqualTo(1L);
        assertThat(responses.get(0).getRole()).isEqualTo(ParticipantRole.ADMIN);
        assertThat(responses.get(1).getUserId()).isEqualTo(2L);
        assertThat(responses.get(1).getRole()).isEqualTo(ParticipantRole.MEMBER);
    }
}
