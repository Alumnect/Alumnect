package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.*;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupResponse;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MentoringGroupServiceImplTest {

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

    @BeforeEach
    void setup() {
        service = new MentoringGroupServiceImpl(
                groupRepository, memberRepository, eventRepository,
                requestRepository, requestMemberRepository, taskRepository,
                userRepository, profileRepository, participantRepository, conversationRepository, notificationService
        );
        ReflectionTestUtils.setField(service, "maxMembers", 10);

        lenient().when(memberRepository.save(any(MentoringGroupMember.class))).thenAnswer(invocation -> {
            MentoringGroupMember m = invocation.getArgument(0);
            if (m.getId() == null) {
                m.setId(99L);
            }
            return m;
        });
    }

    @Test
    @DisplayName("Tạo nhóm độc lập (Group-First): Trưởng nhóm tự động có trạng thái JOINED")
    void createGroup_success_leaderAutoJoined() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));

        CreateMentoringGroupRequest request = new CreateMentoringGroupRequest("FPT Capstone Group", "Nhóm nghiên cứu Spring Boot");

        when(groupRepository.save(any(MentoringGroup.class))).thenAnswer(invocation -> {
            MentoringGroup g = invocation.getArgument(0);
            g.setId(10L);
            g.setCreatedAt(Instant.now());
            return g;
        });

        MentoringGroupResponse response = service.createGroup("leader@alumnect.vn", request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("FPT Capstone Group");
        assertThat(response.isCanManage()).isTrue();

        // Verify member repository saved leader as JOINED
        verify(memberRepository).save(argThat(m ->
                m.getUser().getId().equals(1L) &&
                m.getStatus() == MentoringGroupMemberStatus.JOINED &&
                m.getJoinedAt() != null
        ));

        // Verify event ACCEPTED saved
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.ACCEPTED));
    }

    @Test
    @DisplayName("Tạo nhóm thất bại khi tên nhóm bị trống")
    void createGroup_blankName_throwsBadRequest() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));

        CreateMentoringGroupRequest request = new CreateMentoringGroupRequest("   ", "Mô tả");

        assertThatThrownBy(() -> service.createGroup("leader@alumnect.vn", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tên nhóm không được để trống");

        verifyNoInteractions(groupRepository);
    }

    @Test
    @DisplayName("Leader gửi lời mời: Thành viên nhận trạng thái PENDING và thông báo được gửi")
    void inviteMembers_success_pendingStatus() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User member = activeUser(2L, "student@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        when(memberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        MentoringGroupResponse response = service.invite("leader@alumnect.vn", 10L, List.of(2L));

        assertThat(response).isNotNull();
        verify(memberRepository).save(argThat(m ->
                m.getUser().getId().equals(2L) &&
                m.getInvitedBy().getId().equals(1L) &&
                m.getStatus() == MentoringGroupMemberStatus.PENDING
        ));
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.INVITED));
        verify(notificationService).sendMentoringGroupNotification(
                eq(leader), eq(member), eq(group), eq("INVITATION"), anyString(), anyString(), anyString()
        );
    }

    @Test
    @DisplayName("Không được tự mời chính mình vào nhóm")
    void inviteMembers_selfInvite_throwsBadRequest() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> service.invite("leader@alumnect.vn", 10L, List.of(1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể mời trưởng nhóm");
    }

    @Test
    @DisplayName("Không gửi trùng lời mời khi thành viên đang ở trạng thái PENDING")
    void inviteMembers_alreadyPending_throwsBadRequest() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User member = activeUser(2L, "student@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember existingMember = MentoringGroupMember.builder()
                .group(group)
                .user(member)
                .status(MentoringGroupMemberStatus.PENDING)
                .build();

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        when(memberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.of(existingMember));

        assertThatThrownBy(() -> service.invite("leader@alumnect.vn", 10L, List.of(2L)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("đã có lời mời đang chờ");
    }

    @Test
    @DisplayName("Re-invite: Cho phép mời lại thành viên trước đó từng DECLINED hoặc REMOVED")
    void inviteMembers_reinviteDeclined_success() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User member = activeUser(2L, "student@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember existingMember = MentoringGroupMember.builder()
                .id(100L)
                .group(group)
                .user(member)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.DECLINED)
                .build();

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        when(memberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.of(existingMember));

        service.invite("leader@alumnect.vn", 10L, List.of(2L));

        assertThat(existingMember.getStatus()).isEqualTo(MentoringGroupMemberStatus.PENDING);
        assertThat(existingMember.getInvitedBy().getId()).isEqualTo(1L);
        verify(memberRepository).save(existingMember);
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.REINVITED));
    }

    @Test
    @DisplayName("Thành viên chấp nhận lời mời: Trạng thái đổi thành JOINED và thông báo tới Leader")
    void acceptInvitation_success() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User invitee = activeUser(2L, "invitee@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember membership = MentoringGroupMember.builder()
                .id(50L)
                .group(group)
                .user(invitee)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.PENDING)
                .build();

        when(userRepository.findByEmail("invitee@alumnect.vn")).thenReturn(Optional.of(invitee));
        when(memberRepository.findById(50L)).thenReturn(Optional.of(membership));

        MentoringGroupResponse response = service.acceptInvitation("invitee@alumnect.vn", 50L);

        assertThat(response).isNotNull();
        assertThat(membership.getStatus()).isEqualTo(MentoringGroupMemberStatus.JOINED);
        assertThat(membership.getJoinedAt()).isNotNull();
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.ACCEPTED));
        verify(notificationService).sendMentoringGroupNotification(
                eq(invitee), eq(leader), eq(group), eq("ACCEPTED"), anyString(), anyString(), anyString()
        );
    }

    @Test
    @DisplayName("Người dùng không thể chấp nhận lời mời của người khác")
    void acceptInvitation_otherUser_throwsForbidden() {
        User userA = activeUser(2L, "userA@alumnect.vn");
        User userB = activeUser(3L, "userB@alumnect.vn");
        MentoringGroup group = activeGroup(10L, activeUser(1L, "leader@alumnect.vn"));

        MentoringGroupMember membership = MentoringGroupMember.builder()
                .id(50L)
                .group(group)
                .user(userA)
                .status(MentoringGroupMemberStatus.PENDING)
                .build();

        when(userRepository.findByEmail("userB@alumnect.vn")).thenReturn(Optional.of(userB));
        when(memberRepository.findById(50L)).thenReturn(Optional.of(membership));

        assertThatThrownBy(() -> service.acceptInvitation("userB@alumnect.vn", 50L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không thuộc về tài khoản của bạn");
    }

    @Test
    @DisplayName("Thành viên từ chối lời mời: Trạng thái đổi thành DECLINED")
    void declineInvitation_success() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User invitee = activeUser(2L, "invitee@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember membership = MentoringGroupMember.builder()
                .id(50L)
                .group(group)
                .user(invitee)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.PENDING)
                .build();

        when(userRepository.findByEmail("invitee@alumnect.vn")).thenReturn(Optional.of(invitee));
        when(memberRepository.findById(50L)).thenReturn(Optional.of(membership));

        service.declineInvitation("invitee@alumnect.vn", 50L);

        assertThat(membership.getStatus()).isEqualTo(MentoringGroupMemberStatus.DECLINED);
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.DECLINED));
        verify(notificationService).sendMentoringGroupNotification(
                eq(invitee), eq(leader), eq(group), eq("DECLINED"), anyString(), anyString(), anyString()
        );
    }

    @Test
    @DisplayName("Leader thu hồi lời mời: Chuyển trạng thái sang CANCELLED")
    void cancelInvitation_success() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User invitee = activeUser(2L, "invitee@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember membership = MentoringGroupMember.builder()
                .id(50L)
                .group(group)
                .user(invitee)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.PENDING)
                .build();

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(memberRepository.findById(50L)).thenReturn(Optional.of(membership));

        service.cancelInvitation("leader@alumnect.vn", 10L, 50L);

        assertThat(membership.getStatus()).isEqualTo(MentoringGroupMemberStatus.CANCELLED);
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.CANCELLED));
    }

    @Test
    @DisplayName("Leader loại thành viên khỏi nhóm: Chuyển trạng thái sang REMOVED")
    void removeMember_success() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User member = activeUser(2L, "member@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember membership = MentoringGroupMember.builder()
                .id(50L)
                .group(group)
                .user(member)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.JOINED)
                .build();

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.of(membership));

        service.remove("leader@alumnect.vn", 10L, 2L);

        assertThat(membership.getStatus()).isEqualTo(MentoringGroupMemberStatus.REMOVED);
        assertThat(membership.getRemovedAt()).isNotNull();
        verify(eventRepository).save(argThat(e -> e.getAction() == MentoringGroupMemberAction.REMOVED));
    }

    @Test
    @DisplayName("Thành viên tự rời nhóm: Trạng thái đổi thành REMOVED, Leader không được tự rời")
    void leaveGroup_memberSuccess_leaderThrowsBadRequest() {
        User leader = activeUser(1L, "leader@alumnect.vn");
        User member = activeUser(2L, "member@alumnect.vn");
        MentoringGroup group = activeGroup(10L, leader);

        MentoringGroupMember memberMembership = MentoringGroupMember.builder()
                .id(50L)
                .group(group)
                .user(member)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.JOINED)
                .build();

        when(userRepository.findByEmail("member@alumnect.vn")).thenReturn(Optional.of(member));
        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.of(memberMembership));

        // Member rời nhóm thành công
        service.leaveGroup("member@alumnect.vn", 10L);
        assertThat(memberMembership.getStatus()).isEqualTo(MentoringGroupMemberStatus.REMOVED);

        // Leader rời nhóm bị từ chối
        assertThatThrownBy(() -> service.leaveGroup("leader@alumnect.vn", 10L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Trưởng nhóm không thể rời nhóm");
    }

    // Helper methods
    private User activeUser(Long id, String email) {
        Role role = Role.builder().id(1L).name("STUDENT").build();
        return User.builder()
                .id(id)
                .email(email)
                .accountStatus(AccountStatus.ACTIVE)
                .role(role)
                .build();
    }

    private MentoringGroup activeGroup(Long id, User leader) {
        return MentoringGroup.builder()
                .id(id)
                .name("Group " + id)
                .description("Description " + id)
                .leader(leader)
                .status(MentoringGroupStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
    }
}
