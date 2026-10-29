package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
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
import com.alumnect.alumnect_backend.dto.response.group.GroupMemberResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.group.GroupMapper;
import com.alumnect.alumnect_backend.service.group.GroupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
 * FE-46 Community Groups - Members & Roles.
 * Report sheet : FE-46 (Report5_Unit_Test.xlsx)
 * Functions    : GroupServiceImpl.getMembers(), removeMember(), changeMemberRole()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-46 Community Groups - Members & Roles")
class FE46_GroupMembersTest {

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
    private static final Long OWNER_ID = 11L;
    private static final Long ADMIN_ID = 12L;
    private static final Long TARGET_ID = 13L;

    private static final String OWNER_EMAIL = "owner@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final String TARGET_EMAIL = "target@fpt.edu.vn";

    private User ownerUser;
    private User adminUser;
    private User targetUser;
    private CommunityGroup group;
    private GroupMember ownerMember;
    private GroupMember adminMember;
    private GroupMember targetMember;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();

        ownerUser = User.builder()
                .id(OWNER_ID)
                .email(OWNER_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        adminUser = User.builder()
                .id(ADMIN_ID)
                .email(ADMIN_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        targetUser = User.builder()
                .id(TARGET_ID)
                .email(TARGET_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        group = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Java Developers Club")
                .description("Community for Java enthusiasts")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .owner(ownerUser)
                .memberCount(3)
                .status(GroupStatus.ACTIVE)
                .build();

        ownerMember = GroupMember.builder()
                .id(101L)
                .group(group)
                .user(ownerUser)
                .role(MembershipRole.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        adminMember = GroupMember.builder()
                .id(102L)
                .group(group)
                .user(adminUser)
                .role(MembershipRole.ADMIN)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        targetMember = GroupMember.builder()
                .id(103L)
                .group(group)
                .user(targetUser)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();
    }

    // ================= getMembers() =================

    @Test
    @DisplayName("UTCID01 - Group has 3 members -> Page of members with role and joined time")
    void utcid01_getMembers_ok() {
        // Given
        Page<GroupMember> memberPage = new PageImpl<>(List.of(ownerMember, adminMember, targetMember), PageRequest.of(0, 12), 3);
        UserProfile p1 = UserProfile.builder().userId(OWNER_ID).fullName("Owner Name").build();
        UserProfile p2 = UserProfile.builder().userId(ADMIN_ID).fullName("Admin Name").build();
        UserProfile p3 = UserProfile.builder().userId(TARGET_ID).fullName("Target Name").build();

        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.searchActiveMembers(eq(GROUP_ID), any(), any(), any(Pageable.class))).thenReturn(memberPage);
        when(userProfileRepository.findAllById(any())).thenReturn(List.of(p1, p2, p3));

        // When
        PageResponse<GroupMemberResponse> response = groupService.getMembers(GROUP_ID, null, null, 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(3);
        assertThat(response.getContent().get(0).getRole()).isEqualTo("OWNER");
        assertThat(response.getContent().get(1).getRole()).isEqualTo("ADMIN");
        assertThat(response.getContent().get(2).getRole()).isEqualTo("MEMBER");
    }

    // ================= removeMember() =================

    @Test
    @DisplayName("UTCID02 - Caller is OWNER; target is MEMBER -> Member removed and count -1")
    void utcid02_removeMember_okOwnerRemovesMember() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(ownerUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, TARGET_ID)).thenReturn(Optional.of(targetMember));
        when(conversationRepository.findByCommunityGroupId(GROUP_ID)).thenReturn(Optional.empty());

        // When
        GroupActionResponse response = groupService.removeMember(GROUP_ID, TARGET_ID, OWNER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REMOVED");
        assertThat(response.getMemberCount()).isEqualTo(2);
        assertThat(response.getMessage()).isEqualTo("Đã xóa thành viên khỏi hội nhóm.");
        verify(groupRepository).decrementMemberCount(GROUP_ID);
        verify(memberRepository).save(targetMember);
        assertThat(targetMember.getMembershipStatus()).isEqualTo(MembershipStatus.REMOVED);
    }

    @Test
    @DisplayName("UTCID03 - Caller is ADMIN; target is MEMBER -> Member removed")
    void utcid03_removeMember_okAdminRemovesMember() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_ID)).thenReturn(Optional.of(adminMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, TARGET_ID)).thenReturn(Optional.of(targetMember));
        when(conversationRepository.findByCommunityGroupId(GROUP_ID)).thenReturn(Optional.empty());

        // When
        GroupActionResponse response = groupService.removeMember(GROUP_ID, TARGET_ID, ADMIN_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REMOVED");
        assertThat(response.getMessage()).isEqualTo("Đã xóa thành viên khỏi hội nhóm.");
        verify(groupRepository).decrementMemberCount(GROUP_ID);
        verify(memberRepository).save(targetMember);
    }

    @Test
    @DisplayName("UTCID04 - Caller is ADMIN; target is OWNER -> ForbiddenException")
    void utcid04_removeMember_forbiddenCannotRemoveOwner() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_ID)).thenReturn(Optional.of(adminMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));

        // When + Then
        assertThatThrownBy(() -> groupService.removeMember(GROUP_ID, OWNER_ID, ADMIN_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Không thể xóa chủ sở hữu khỏi hội nhóm.");
        verify(groupRepository, never()).decrementMemberCount(any());
    }

    @Test
    @DisplayName("UTCID05 - Caller is MEMBER -> ForbiddenException")
    void utcid05_removeMember_forbiddenCallerIsMember() {
        // Given
        when(userRepository.findByEmail(TARGET_EMAIL)).thenReturn(Optional.of(targetUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, TARGET_ID)).thenReturn(Optional.of(targetMember));

        // When + Then
        assertThatThrownBy(() -> groupService.removeMember(GROUP_ID, ADMIN_ID, TARGET_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền quản lý hội nhóm này.");
        verify(memberRepository, never()).save(any());
    }

    // ================= changeMemberRole() =================

    @Test
    @DisplayName("UTCID06 - Caller is OWNER; group has no ADMIN -> Target becomes ADMIN")
    void utcid06_changeMemberRole_okPromoteToAdmin() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(ownerUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, TARGET_ID)).thenReturn(Optional.of(targetMember));
        when(memberRepository.countByGroupIdAndRoleAndMembershipStatus(GROUP_ID, MembershipRole.ADMIN, MembershipStatus.ACTIVE)).thenReturn(0L);

        // When
        GroupActionResponse response = groupService.changeMemberRole(GROUP_ID, TARGET_ID, OWNER_EMAIL, MembershipRole.ADMIN);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("ADMIN");
        assertThat(response.getMessage()).isEqualTo("Đã phân quyền quản trị viên.");
        verify(memberRepository).save(targetMember);
        assertThat(targetMember.getRole()).isEqualTo(MembershipRole.ADMIN);
    }

    @Test
    @DisplayName("UTCID07 - Group already has an ADMIN -> BadRequestException")
    void utcid07_changeMemberRole_badRequestAdminExists() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(ownerUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, TARGET_ID)).thenReturn(Optional.of(targetMember));
        when(memberRepository.countByGroupIdAndRoleAndMembershipStatus(GROUP_ID, MembershipRole.ADMIN, MembershipStatus.ACTIVE)).thenReturn(1L);

        // When + Then
        assertThatThrownBy(() -> groupService.changeMemberRole(GROUP_ID, TARGET_ID, OWNER_EMAIL, MembershipRole.ADMIN))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mỗi hội nhóm chỉ được có một quản trị viên. Hãy gỡ Admin hiện tại trước.");
        verify(memberRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - Target is ADMIN -> Target demoted to MEMBER")
    void utcid08_changeMemberRole_okDemoteToMember() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(ownerUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(GROUP_ID, ADMIN_ID)).thenReturn(Optional.of(adminMember));

        // When
        GroupActionResponse response = groupService.changeMemberRole(GROUP_ID, ADMIN_ID, OWNER_EMAIL, MembershipRole.MEMBER);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("MEMBER");
        assertThat(response.getMessage()).isEqualTo("Đã thu hồi quyền quản trị viên.");
        verify(memberRepository).save(adminMember);
        assertThat(adminMember.getRole()).isEqualTo(MembershipRole.MEMBER);
    }

    @Test
    @DisplayName("UTCID09 - Caller is ADMIN -> ForbiddenException")
    void utcid09_changeMemberRole_forbiddenCallerIsAdmin() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_ID)).thenReturn(Optional.of(adminMember));

        // When + Then
        assertThatThrownBy(() -> groupService.changeMemberRole(GROUP_ID, TARGET_ID, ADMIN_EMAIL, MembershipRole.ADMIN))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ chủ sở hữu hội nhóm mới có quyền thực hiện thao tác này.");
        verify(memberRepository, never()).save(any());
    }
}
