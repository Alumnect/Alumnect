package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupMemberEventRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupMemberRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestMemberRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroup;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroupMember;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit Test Suite cho FE-61: Mentoring - Group Mentorship
 * Tổng cộng 18 Test Cases (UTCID01 -> UTCID18).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-61 Mentoring - Group Mentorship")
class FE61_MentoringGroupTest {

    @Mock
    private MentoringGroupRepository groupRepository;

    @Mock
    private MentoringGroupMemberRepository memberRepository;

    @Mock
    private MentoringGroupMemberEventRepository eventRepository;

    @Mock
    private MentoringRequestRepository requestRepository;

    @Mock
    private MentoringRequestMemberRepository requestMemberRepository;

    @Mock
    private MentoringTaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository profileRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private NotificationService notificationService;

    private MentoringGroupServiceImpl groupService;

    private static final Long LEADER_ID = 1L;
    private static final Long MEMBER1_ID = 2L;
    private static final Long MEMBER2_ID = 3L;
    private static final Long OTHER_ID = 99L;
    private static final Long GROUP_ID = 100L;
    private static final Long INVITATION_ID = 500L;

    private static final String LEADER_EMAIL = "leader@fpt.edu.vn";
    private static final String MEMBER1_EMAIL = "member1@fpt.edu.vn";
    private static final String OTHER_EMAIL = "other@fpt.edu.vn";

    private User leaderUser;
    private User member1User;
    private User member2User;
    private MentoringGroup group;
    private MentoringGroupMember memberRecord;

    @BeforeEach
    void setUp() {
        groupService = new MentoringGroupServiceImpl(
                groupRepository,
                memberRepository,
                eventRepository,
                requestRepository,
                requestMemberRepository,
                taskRepository,
                userRepository,
                profileRepository,
                participantRepository,
                conversationRepository,
                notificationService
        );
        ReflectionTestUtils.setField(groupService, "maxMembers", 10);

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();

        leaderUser = User.builder().id(LEADER_ID).email(LEADER_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();
        member1User = User.builder().id(MEMBER1_ID).email(MEMBER1_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();
        member2User = User.builder().id(MEMBER2_ID).email("member2@fpt.edu.vn").role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        group = MentoringGroup.builder()
                .id(GROUP_ID)
                .name("Nhóm mentoring · Đồ án tốt nghiệp")
                .leader(leaderUser)
                .status(MentoringGroupStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        memberRecord = MentoringGroupMember.builder()
                .id(INVITATION_ID)
                .group(group)
                .user(member1User)
                .invitedBy(leaderUser)
                .status(MentoringGroupMemberStatus.PENDING)
                .invitedAt(Instant.now())
                .build();
    }

    // ================= UTCID01 -> UTCID07: createGroup & createForRequest =================

    @Test
    @DisplayName("UTCID01 - ACTIVE student; 2 active invitees -> createForRequest -> Group created, invitations sent")
    void utcid01_createGroup_ok() {
        // Given
        when(userRepository.findAllById(any())).thenReturn(List.of(member1User, member2User));
        when(groupRepository.save(any(MentoringGroup.class))).thenReturn(group);
        when(memberRepository.save(any(MentoringGroupMember.class))).thenAnswer(i -> {
            MentoringGroupMember m = i.getArgument(0);
            m.setId(10L);
            return m;
        });

        // When
        MentoringGroup created = groupService.createForRequest(leaderUser, "Đồ án tốt nghiệp", List.of(MEMBER1_ID, MEMBER2_ID));

        // Then
        assertThat(created).isNotNull();
        assertThat(created.getLeader()).isEqualTo(leaderUser);
        verify(groupRepository).save(any(MentoringGroup.class));
        verify(memberRepository, org.mockito.Mockito.atLeast(2)).save(any(MentoringGroupMember.class));
    }

    @Test
    @DisplayName("UTCID02 - name blank -> createGroup -> BadRequestException")
    void utcid02_createGroup_badRequest() {
        // Given
        CreateMentoringGroupRequest request = CreateMentoringGroupRequest.builder().name("   ").build();
        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));

        // When + Then
        assertThatThrownBy(() -> groupService.createGroup(LEADER_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tên nhóm không được để trống");
    }

    @Test
    @DisplayName("UTCID03 - memberIds = [] -> createForRequest -> BadRequestException")
    void utcid03_createGroup_badRequest() {
        // When + Then
        assertThatThrownBy(() -> groupService.createForRequest(leaderUser, "Team", Collections.emptyList()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mentoring nhóm cần ít nhất một thành viên ngoài trưởng nhóm");
    }

    @Test
    @DisplayName("UTCID04 - memberIds = [2,2] -> createForRequest -> BadRequestException")
    void utcid04_createGroup_badRequest() {
        // When + Then
        assertThatThrownBy(() -> groupService.createForRequest(leaderUser, "Team", List.of(2L, 2L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Danh sách thành viên bị trùng");
    }

    @Test
    @DisplayName("UTCID05 - memberIds contains leader -> createForRequest -> BadRequestException")
    void utcid05_createGroup_badRequest() {
        // When + Then
        assertThatThrownBy(() -> groupService.createForRequest(leaderUser, "Team", List.of(LEADER_ID)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Trưởng nhóm không thể tự mời chính mình");
    }

    @Test
    @DisplayName("UTCID06 - Invitee is locked -> createForRequest -> BadRequestException")
    void utcid06_createGroup_badRequest() {
        // Given: member1 is locked
        User lockedUser = User.builder().id(MEMBER1_ID).email("locked@fpt.edu.vn").accountStatus(AccountStatus.LOCKED).build();
        when(userRepository.findAllById(any())).thenReturn(List.of(lockedUser));

        // When + Then
        assertThatThrownBy(() -> groupService.createForRequest(leaderUser, "Team", List.of(MEMBER1_ID)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ có thể mời tài khoản đang hoạt động");
    }

    @Test
    @DisplayName("UTCID07 - Caller is STAFF without student/alumni role -> createGroup -> ForbiddenException")
    void utcid07_createGroup_forbidden() {
        // Given: caller has STAFF role
        Role staffRole = Role.builder().id(4L).name("STAFF").build();
        User staffUser = User.builder().id(OTHER_ID).email(OTHER_EMAIL).role(staffRole).accountStatus(AccountStatus.ACTIVE).build();
        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(staffUser));

        CreateMentoringGroupRequest request = CreateMentoringGroupRequest.builder().name("Nhóm nghiên cứu").build();

        // When + Then
        assertThatThrownBy(() -> groupService.createGroup(OTHER_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên hoặc cựu sinh viên mới có quyền tạo nhóm Mentoring");
    }

    // ================= UTCID08 -> UTCID10: updateGroup & invite =================

    @Test
    @DisplayName("UTCID08 - Caller is the leader -> updateGroup -> Group updated")
    void utcid08_updateGroup_ok() {
        // Given
        UpdateMentoringGroupRequest request = UpdateMentoringGroupRequest.builder()
                .name("Tên nhóm mới cập nhật")
                .description("Mô tả mới")
                .build();

        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupRepository.save(any(MentoringGroup.class))).thenReturn(group);

        // When
        MentoringGroupResponse response = groupService.updateGroup(LEADER_EMAIL, GROUP_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(group.getName()).isEqualTo("Tên nhóm mới cập nhật");
        verify(groupRepository).save(group);
    }

    @Test
    @DisplayName("UTCID09 - Caller is a member -> updateGroup -> ForbiddenException")
    void utcid09_updateGroup_forbidden() {
        // Given
        UpdateMentoringGroupRequest request = UpdateMentoringGroupRequest.builder().name("Đổi tên").build();
        when(userRepository.findByEmail(MEMBER1_EMAIL)).thenReturn(Optional.of(member1User));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When + Then
        assertThatThrownBy(() -> groupService.updateGroup(MEMBER1_EMAIL, GROUP_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ trưởng nhóm mới có quyền chỉnh sửa thông tin nhóm");
    }

    @Test
    @DisplayName("UTCID10 - Group is closed -> invite -> BadRequestException")
    void utcid10_invite_badRequest() {
        // Given: group is CLOSED
        group.setStatus(MentoringGroupStatus.CLOSED);
        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When + Then
        assertThatThrownBy(() -> groupService.invite(LEADER_EMAIL, GROUP_ID, List.of(4L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Nhóm đã đóng, không thể gửi thêm lời mời");
    }

    // ================= UTCID11 -> UTCID14: Invitations =================

    @Test
    @DisplayName("UTCID11 - Invitation pending; caller is invitee -> acceptInvitation -> Member JOINED, leader notified")
    void utcid11_acceptInvitation_ok() {
        // Given
        when(userRepository.findByEmail(MEMBER1_EMAIL)).thenReturn(Optional.of(member1User));
        when(memberRepository.findById(INVITATION_ID)).thenReturn(Optional.of(memberRecord));
        when(memberRepository.save(any(MentoringGroupMember.class))).thenReturn(memberRecord);

        // When
        MentoringGroupResponse response = groupService.acceptInvitation(MEMBER1_EMAIL, INVITATION_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(memberRecord.getStatus()).isEqualTo(MentoringGroupMemberStatus.JOINED);
        verify(memberRepository).save(memberRecord);
        verify(eventRepository).save(any());
        verify(notificationService).sendMentoringGroupNotification(eq(member1User), eq(leaderUser), eq(group), any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID12 - Invitation of another user -> acceptInvitation -> ForbiddenException")
    void utcid12_acceptInvitation_forbidden() {
        // Given: other user tries to accept member1's invitation
        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(User.builder().id(OTHER_ID).email(OTHER_EMAIL).build()));
        when(memberRepository.findById(INVITATION_ID)).thenReturn(Optional.of(memberRecord));

        // When + Then
        assertThatThrownBy(() -> groupService.acceptInvitation(OTHER_EMAIL, INVITATION_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Lời mời này không thuộc về tài khoản của bạn");
    }

    @Test
    @DisplayName("UTCID13 - Invitation already processed -> acceptInvitation -> ConflictException")
    void utcid13_acceptInvitation_conflict() {
        // Given: status is already DECLINED
        memberRecord.setStatus(MentoringGroupMemberStatus.DECLINED);
        when(userRepository.findByEmail(MEMBER1_EMAIL)).thenReturn(Optional.of(member1User));
        when(memberRepository.findById(INVITATION_ID)).thenReturn(Optional.of(memberRecord));

        // When + Then
        assertThatThrownBy(() -> groupService.acceptInvitation(MEMBER1_EMAIL, INVITATION_ID))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Lời mời không còn hiệu lực");
    }

    @Test
    @DisplayName("UTCID14 - Invitation pending; caller is leader -> cancelInvitation -> Invitation CANCELLED")
    void utcid14_cancelInvitation_ok() {
        // Given
        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findById(INVITATION_ID)).thenReturn(Optional.of(memberRecord));
        when(memberRepository.save(any(MentoringGroupMember.class))).thenReturn(memberRecord);

        // When
        MentoringGroupResponse response = groupService.cancelInvitation(LEADER_EMAIL, GROUP_ID, INVITATION_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(memberRecord.getStatus()).isEqualTo(MentoringGroupMemberStatus.CANCELLED);
        verify(memberRepository).save(memberRecord);
    }

    // ================= UTCID15 -> UTCID18: Leave & Delete Group =================

    @Test
    @DisplayName("UTCID15 - Caller is a member -> leaveGroup -> Member leaves, leader notified")
    void utcid15_leaveGroup_ok() {
        // Given
        memberRecord.setStatus(MentoringGroupMemberStatus.JOINED);
        when(userRepository.findByEmail(MEMBER1_EMAIL)).thenReturn(Optional.of(member1User));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, MEMBER1_ID)).thenReturn(Optional.of(memberRecord));
        when(memberRepository.save(any(MentoringGroupMember.class))).thenReturn(memberRecord);

        // When
        MentoringGroupResponse response = groupService.leaveGroup(MEMBER1_EMAIL, GROUP_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(memberRecord.getStatus()).isEqualTo(MentoringGroupMemberStatus.REMOVED);
        verify(memberRepository).save(memberRecord);
        verify(notificationService).sendMentoringGroupNotification(eq(member1User), eq(leaderUser), eq(group), any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID16 - Caller is the leader -> leaveGroup -> BadRequestException")
    void utcid16_leaveGroup_badRequest() {
        // Given
        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When + Then
        assertThatThrownBy(() -> groupService.leaveGroup(LEADER_EMAIL, GROUP_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Trưởng nhóm không thể rời nhóm khi chưa chuyển giao quyền hoặc đóng nhóm");
    }

    @Test
    @DisplayName("UTCID17 - No open request / task -> deleteGroup -> Group dissolved (CANCELLED)")
    void utcid17_deleteGroup_ok() {
        // Given
        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(requestRepository.findByGroupIdOrderByCreatedAtDesc(GROUP_ID)).thenReturn(Collections.emptyList());
        when(memberRepository.findByGroupIdOrderByInvitedAtAsc(GROUP_ID)).thenReturn(Collections.emptyList());

        // When
        groupService.deleteGroup(LEADER_EMAIL, GROUP_ID);

        // Then
        assertThat(group.getStatus()).isEqualTo(MentoringGroupStatus.CANCELLED);
        verify(groupRepository).save(group);
    }

    @Test
    @DisplayName("UTCID18 - Group has open request -> deleteGroup -> ConflictException")
    void utcid18_deleteGroup_conflict() {
        // Given: active open request
        MentoringRequest openRequest = MentoringRequest.builder()
                .id(200L)
                .status(MentoringRequestStatus.OPEN)
                .build();

        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leaderUser));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(requestRepository.findByGroupIdOrderByCreatedAtDesc(GROUP_ID)).thenReturn(List.of(openRequest));

        // When + Then
        assertThatThrownBy(() -> groupService.deleteGroup(LEADER_EMAIL, GROUP_ID))
                .isInstanceOf(ConflictException.class)
                .hasMessageStartingWith("Nhóm đang có yêu cầu hoặc nhiệm vụ mentoring chưa kết thúc");
    }
}
