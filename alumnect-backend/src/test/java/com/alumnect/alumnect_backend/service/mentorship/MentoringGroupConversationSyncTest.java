package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Thành viên nhóm được đưa vào Chat for Task từ giai đoạn Deal và mất quyền khi rời nhóm. */
@ExtendWith(MockitoExtension.class)
class MentoringGroupConversationSyncTest {
    @Mock MentoringGroupRepository groupRepository;
    @Mock MentoringGroupMemberRepository memberRepository;
    @Mock MentoringGroupMemberEventRepository eventRepository;
    @Mock MentoringRequestRepository requestRepository;
    @Mock MentoringRequestMemberRepository requestMemberRepository;
    @Mock MentoringTaskRepository taskRepository;
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository profileRepository;
    @Mock ConversationParticipantRepository participantRepository;
    @Mock ConversationRepository conversationRepository;
    @Mock NotificationService notificationService;
    MentoringGroupServiceImpl service;

    User leader = user(1L), mentor = user(9L), joined = user(2L), left = user(3L);
    MentoringGroup group = MentoringGroup.builder().id(50L).name("Nhóm Java").leader(leader).build();
    MentoringRequest request = MentoringRequest.builder().id(70L).title("Java").student(leader).group(group).build();
    Conversation conversation = Conversation.builder().id(80L).mentoringRequest(request)
            .mentoringStudent(leader).mentoringMentor(mentor).build();

    @BeforeEach void setup() {
        service = new MentoringGroupServiceImpl(groupRepository, memberRepository, eventRepository,
                requestRepository, requestMemberRepository, taskRepository, userRepository, profileRepository,
                participantRepository, conversationRepository, notificationService);
    }

    @Test void dealChatAddsSnapshotMembersStillInGroupAndNotifiesThem() {
        when(requestMemberRepository.existsByRequestId(70L)).thenReturn(true);
        when(requestMemberRepository.findByRequestId(70L)).thenReturn(List.of(snapshot(leader), snapshot(joined), snapshot(left)));
        when(memberRepository.findByGroupIdAndUserId(50L, 1L)).thenReturn(Optional.of(member(leader, MentoringGroupMemberStatus.JOINED)));
        when(memberRepository.findByGroupIdAndUserId(50L, 2L)).thenReturn(Optional.of(member(joined, MentoringGroupMemberStatus.JOINED)));
        when(memberRepository.findByGroupIdAndUserId(50L, 3L)).thenReturn(Optional.of(member(left, MentoringGroupMemberStatus.REMOVED)));

        service.synchronizeConversationParticipants(request, conversation);

        ArgumentCaptor<ConversationParticipant> saved = ArgumentCaptor.forClass(ConversationParticipant.class);
        verify(participantRepository).save(saved.capture());
        assertThat(saved.getValue().getUser().getId()).isEqualTo(2L);
        verify(notificationService).sendMentoringGroupNotification(eq(mentor), eq(joined), eq(group),
                eq("REQUEST_CHAT"), eq("80"), anyString(), anyString());
    }

    @Test void memberWhoLeftGroupLosesRequestAccessDespiteSnapshot() {
        when(requestMemberRepository.existsByRequestIdAndUserId(70L, 3L)).thenReturn(true);
        when(requestMemberRepository.existsByRequestId(70L)).thenReturn(true);
        when(memberRepository.findByGroupIdAndUserId(50L, 3L)).thenReturn(Optional.of(member(left, MentoringGroupMemberStatus.REMOVED)));

        assertThat(service.isActiveMember(request, 3L)).isFalse();
    }

    @Test void leavingGroupRevokesDealChatAccess() {
        when(groupRepository.findById(50L)).thenReturn(Optional.of(group));
        when(userRepository.findByEmail("joined@alumnect.vn")).thenReturn(Optional.of(joined));
        when(memberRepository.findByGroupIdAndUserId(50L, 2L)).thenReturn(Optional.of(member(joined, MentoringGroupMemberStatus.JOINED)));
        when(requestRepository.findByGroupIdOrderByCreatedAtDesc(50L)).thenReturn(List.of(request));
        when(conversationRepository.findByMentoringRequestIdOrderByCreatedAtAsc(70L)).thenReturn(List.of(conversation));

        service.leaveGroup("joined@alumnect.vn", 50L);

        verify(participantRepository).deleteByConversationIdAndUserId(80L, 2L);
    }

    private static User user(Long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("user" + id + "@alumnect.vn");
        return u;
    }

    private MentoringRequestMember snapshot(User u) {
        return MentoringRequestMember.builder().request(request).user(u).build();
    }

    private MentoringGroupMember member(User u, MentoringGroupMemberStatus status) {
        return MentoringGroupMember.builder().id(100L + u.getId()).group(group).user(u).status(status).build();
    }
}
