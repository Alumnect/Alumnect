package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.enums.JoinRequestAction;
import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.common.enums.MembershipStatus;
import com.alumnect.alumnect_backend.dao.group.CommunityGroupRepository;
import com.alumnect.alumnect_backend.dao.group.GroupMemberRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.group.GroupActionResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMembershipResponse;
import com.alumnect.alumnect_backend.dto.response.group.JoinRequestResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.group.GroupMapper;
import com.alumnect.alumnect_backend.service.group.GroupServiceImpl;
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

import java.time.Instant;
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
 * FE-45 Community Groups - Join, Leave & Handle Join Requests.
 * Report sheet : FE-45 (Report5_Unit_Test.xlsx)
 * Functions    : GroupServiceImpl.joinGroup(), leaveGroup(), getJoinRequests(), handleJoinRequest()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-45 Community Groups - Join, Leave & Handle Join Requests")
class FE45_GroupJoinLeaveTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private CommunityGroupRepository groupRepository;

    @Mock
    private GroupMemberRepository memberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository conversationParticipantRepository;

    @Mock
    private MessageRepository messageRepository;

    @Spy
    private GroupMapper groupMapper = new GroupMapper();

    // ===== System under test =====
    @InjectMocks
    private GroupServiceImpl groupService;

    // ===== Test data =====
    private static final Long GROUP_ID = 1L;
    private static final Long USER_ID = 10L;
    private static final Long OWNER_ID = 11L;
    private static final Long ADMIN_USER_ID = 12L;
    private static final Long APPLICANT_ID = 13L;
    private static final Long REQUEST_ID = 201L;

    private static final String USER_EMAIL = "student@fpt.edu.vn";
    private static final String OWNER_EMAIL = "owner@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";

    private User user;
    private User owner;
    private User adminUser;
    private User applicant;
    private CommunityGroup publicActiveGroup;
    private CommunityGroup privateActiveGroup;
    private CommunityGroup inactiveGroup;
    private GroupMember ownerMember;
    private GroupMember adminMember;
    private GroupMember regularMember;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();

        user = User.builder()
                .id(USER_ID)
                .email(USER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        owner = User.builder()
                .id(OWNER_ID)
                .email(OWNER_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        adminUser = User.builder()
                .id(ADMIN_USER_ID)
                .email(ADMIN_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        applicant = User.builder()
                .id(APPLICANT_ID)
                .email("applicant@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        publicActiveGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Public Java Club")
                .description("Public Club")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .owner(owner)
                .memberCount(10)
                .status(GroupStatus.ACTIVE)
                .build();

        privateActiveGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Private Java Club")
                .description("Private Club")
                .category("technology")
                .privacy(GroupPrivacy.PRIVATE)
                .owner(owner)
                .memberCount(10)
                .status(GroupStatus.ACTIVE)
                .build();

        inactiveGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Inactive Java Club")
                .description("Inactive Club")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .owner(owner)
                .memberCount(10)
                .status(GroupStatus.INACTIVE)
                .build();

        ownerMember = GroupMember.builder()
                .id(101L)
                .group(publicActiveGroup)
                .user(owner)
                .role(MembershipRole.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        adminMember = GroupMember.builder()
                .id(102L)
                .group(publicActiveGroup)
                .user(adminUser)
                .role(MembershipRole.ADMIN)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        regularMember = GroupMember.builder()
                .id(103L)
                .group(publicActiveGroup)
                .user(user)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();
    }

    // ================= joinGroup() =================

    @Test
    @DisplayName("UTCID01 - Group is public and ACTIVE; user not a member -> Membership ACTIVE, member count +1")
    void utcid01_joinGroup_okPublic() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, USER_ID)).thenReturn(Optional.empty());

        // When
        GroupMembershipResponse response = groupService.joinGroup(GROUP_ID, USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getViewerMembershipStatus()).isEqualTo("ACTIVE");
        assertThat(response.getViewerRole()).isEqualTo("MEMBER");
        assertThat(response.getMemberCount()).isEqualTo(11);
        verify(groupRepository).incrementMemberCount(GROUP_ID);
        verify(memberRepository).saveAndFlush(any(GroupMember.class));
    }

    @Test
    @DisplayName("UTCID02 - Group is private and ACTIVE -> Membership PENDING; member count unchanged")
    void utcid02_joinGroup_okPrivatePending() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(privateActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, USER_ID)).thenReturn(Optional.empty());

        // When
        GroupMembershipResponse response = groupService.joinGroup(GROUP_ID, USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getViewerMembershipStatus()).isEqualTo("PENDING");
        assertThat(response.getMemberCount()).isEqualTo(10);
        verify(groupRepository, never()).incrementMemberCount(any());
        verify(memberRepository).saveAndFlush(any(GroupMember.class));
    }

    @Test
    @DisplayName("UTCID03 - User is already an ACTIVE member -> ConflictException")
    void utcid03_joinGroup_conflictAlreadyMember() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, USER_ID)).thenReturn(Optional.of(regularMember));

        // When + Then
        assertThatThrownBy(() -> groupService.joinGroup(GROUP_ID, USER_EMAIL))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã là thành viên của hội nhóm này.");
        verify(groupRepository, never()).incrementMemberCount(any());
    }

    @Test
    @DisplayName("UTCID04 - User has a PENDING request -> ConflictException")
    void utcid04_joinGroup_conflictPending() {
        // Given
        GroupMember pendingMember = GroupMember.builder()
                .id(104L)
                .group(privateActiveGroup)
                .user(user)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.PENDING)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(privateActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, USER_ID)).thenReturn(Optional.of(pendingMember));

        // When + Then
        assertThatThrownBy(() -> groupService.joinGroup(GROUP_ID, USER_EMAIL))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã gửi yêu cầu tham gia, vui lòng chờ Owner/Admin duyệt.");
        verify(groupRepository, never()).incrementMemberCount(any());
    }

    @Test
    @DisplayName("UTCID05 - Group is INACTIVE -> BadRequestException")
    void utcid05_joinGroup_badRequestInactive() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(inactiveGroup));

        // When + Then
        assertThatThrownBy(() -> groupService.joinGroup(GROUP_ID, USER_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Hội nhóm đang tạm ngừng hoạt động.");
        verify(memberRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - User previously left group -> Membership reactivated")
    void utcid06_joinGroup_okReactivate() {
        // Given
        GroupMember leftMember = GroupMember.builder()
                .id(105L)
                .group(publicActiveGroup)
                .user(user)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.LEFT)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, USER_ID)).thenReturn(Optional.of(leftMember));

        // When
        GroupMembershipResponse response = groupService.joinGroup(GROUP_ID, USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getViewerMembershipStatus()).isEqualTo("ACTIVE");
        assertThat(response.getMemberCount()).isEqualTo(11);
        verify(groupRepository).incrementMemberCount(GROUP_ID);
        verify(memberRepository).save(leftMember);
        assertThat(leftMember.getMembershipStatus()).isEqualTo(MembershipStatus.ACTIVE);
    }

    // ================= leaveGroup() =================

    @Test
    @DisplayName("UTCID07 - User is MEMBER -> Membership set to LEFT; member count -1")
    void utcid07_leaveGroup_okMember() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, USER_ID)).thenReturn(Optional.of(regularMember));
        when(conversationRepository.findByCommunityGroupId(GROUP_ID)).thenReturn(Optional.empty());

        // When
        GroupMembershipResponse response = groupService.leaveGroup(GROUP_ID, USER_EMAIL, null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getViewerMembershipStatus()).isEqualTo("LEFT");
        assertThat(response.getMemberCount()).isEqualTo(9);
        verify(groupRepository).decrementMemberCount(GROUP_ID);
        verify(memberRepository).save(regularMember);
        assertThat(regularMember.getMembershipStatus()).isEqualTo(MembershipStatus.LEFT);
    }

    @Test
    @DisplayName("UTCID08 - User is OWNER with other members -> BadRequestException")
    void utcid08_leaveGroup_badRequestOwner() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.countByGroupIdAndMembershipStatus(GROUP_ID, MembershipStatus.ACTIVE)).thenReturn(5L);

        // When + Then
        assertThatThrownBy(() -> groupService.leaveGroup(GROUP_ID, OWNER_EMAIL, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn là chủ sở hữu, hãy chuyển quyền sở hữu cho một thành viên khác trước khi rời nhóm.");
        verify(groupRepository, never()).decrementMemberCount(any());
    }

    // ================= getJoinRequests() =================

    @Test
    @DisplayName("UTCID09 - Caller is OWNER; pending requests exist -> List of pending requests")
    void utcid09_getJoinRequests_ok() {
        // Given
        GroupMember pendingRequest = GroupMember.builder()
                .id(REQUEST_ID)
                .group(publicActiveGroup)
                .user(applicant)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.PENDING)
                .updatedAt(Instant.now())
                .build();

        UserProfile applicantProfile = UserProfile.builder()
                .userId(APPLICANT_ID)
                .user(applicant)
                .fullName("Le Van Applicant")
                .avatarUrl("https://example.com/applicant.png")
                .build();

        Page<GroupMember> page = new PageImpl<>(List.of(pendingRequest), PageRequest.of(0, 12), 1);

        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findPendingRequests(eq(GROUP_ID), any(Pageable.class))).thenReturn(page);
        when(userProfileRepository.findAllById(any())).thenReturn(List.of(applicantProfile));

        // When
        PageResponse<JoinRequestResponse> response = groupService.getJoinRequests(GROUP_ID, OWNER_EMAIL, 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getRequestId()).isEqualTo(REQUEST_ID);
        assertThat(response.getContent().get(0).getFullName()).isEqualTo("Le Van Applicant");
        assertThat(response.getContent().get(0).getStatus()).isEqualTo("PENDING");
    }

    // ================= handleJoinRequest() =================

    @Test
    @DisplayName("UTCID10 - Caller is OWNER; approve request -> Member becomes ACTIVE")
    void utcid10_handleJoinRequest_okApprove() {
        // Given
        GroupMember pendingRequest = GroupMember.builder()
                .id(REQUEST_ID)
                .group(publicActiveGroup)
                .user(applicant)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.PENDING)
                .build();

        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByIdAndGroupIdForUpdate(REQUEST_ID, GROUP_ID)).thenReturn(Optional.of(pendingRequest));

        // When
        GroupActionResponse response = groupService.handleJoinRequest(GROUP_ID, REQUEST_ID, OWNER_EMAIL, JoinRequestAction.APPROVE);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.getMemberCount()).isEqualTo(11);
        assertThat(response.getMessage()).isEqualTo("Đã chấp nhận yêu cầu tham gia.");
        verify(groupRepository).incrementMemberCount(GROUP_ID);
        verify(memberRepository).save(pendingRequest);
        assertThat(pendingRequest.getMembershipStatus()).isEqualTo(MembershipStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID11 - Caller is ADMIN; reject request -> Request REJECTED")
    void utcid11_handleJoinRequest_okReject() {
        // Given
        GroupMember pendingRequest = GroupMember.builder()
                .id(REQUEST_ID)
                .group(publicActiveGroup)
                .user(applicant)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.PENDING)
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_USER_ID)).thenReturn(Optional.of(adminMember));
        when(memberRepository.findByIdAndGroupIdForUpdate(REQUEST_ID, GROUP_ID)).thenReturn(Optional.of(pendingRequest));

        // When
        GroupActionResponse response = groupService.handleJoinRequest(GROUP_ID, REQUEST_ID, ADMIN_EMAIL, JoinRequestAction.REJECT);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REJECTED");
        assertThat(response.getMessage()).isEqualTo("Đã từ chối yêu cầu tham gia.");
        verify(groupRepository, never()).incrementMemberCount(any());
        verify(memberRepository).save(pendingRequest);
        assertThat(pendingRequest.getMembershipStatus()).isEqualTo(MembershipStatus.REJECTED);
    }

    @Test
    @DisplayName("UTCID12 - Caller is MEMBER -> ForbiddenException")
    void utcid12_handleJoinRequest_forbidden() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicActiveGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(regularMember));

        // When + Then
        assertThatThrownBy(() -> groupService.handleJoinRequest(GROUP_ID, REQUEST_ID, USER_EMAIL, JoinRequestAction.APPROVE))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền quản lý hội nhóm này.");
        verify(memberRepository, never()).save(any());
    }
}
