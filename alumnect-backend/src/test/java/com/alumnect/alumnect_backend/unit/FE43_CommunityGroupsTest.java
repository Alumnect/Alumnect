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
import com.alumnect.alumnect_backend.dto.response.group.GroupCardResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupDetailResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
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
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-43 Community Groups - View, Search & Group Detail.
 * Report sheet : FE-43 (Report5_Unit_Test.xlsx)
 * Functions    : GroupServiceImpl.listGroups(), getMyGroups(), getGroupDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-43 Community Groups - View, Search & Group Detail")
class FE43_CommunityGroupsTest {

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
    private static final Long GROUP_ID_1 = 1L;
    private static final Long GROUP_ID_2 = 2L;
    private static final Long DELETED_GROUP_ID = 3L;
    private static final Long NON_EXISTENT_ID = 99L;
    private static final Long USER_ID = 10L;
    private static final Long OWNER_ID = 11L;
    private static final String USER_EMAIL = "member@fpt.edu.vn";
    private static final String OWNER_EMAIL = "owner@fpt.edu.vn";

    private User user;
    private User owner;
    private UserProfile ownerProfile;
    private CommunityGroup group1;
    private CommunityGroup group2;
    private GroupMember member1;
    private GroupMember member2;

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

        ownerProfile = UserProfile.builder()
                .userId(OWNER_ID)
                .user(owner)
                .fullName("Nguyen Van Owner")
                .avatarUrl("https://example.com/avatar.png")
                .build();

        group1 = CommunityGroup.builder()
                .id(GROUP_ID_1)
                .name("Java Developers Club")
                .description("Community for Java enthusiasts at FPT")
                .category("technology")
                .topics(List.of("java", "spring"))
                .privacy(GroupPrivacy.PUBLIC)
                .joinRules("Be nice")
                .owner(owner)
                .memberCount(15)
                .status(GroupStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        group2 = CommunityGroup.builder()
                .id(GROUP_ID_2)
                .name("Sports Club")
                .description("Football and badminton activities")
                .category("sports")
                .topics(List.of("football", "badminton"))
                .privacy(GroupPrivacy.PUBLIC)
                .joinRules("Active participation")
                .owner(owner)
                .memberCount(25)
                .status(GroupStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        member1 = GroupMember.builder()
                .id(101L)
                .group(group1)
                .user(user)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        member2 = GroupMember.builder()
                .id(102L)
                .group(group2)
                .user(user)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();
    }

    // ================= listGroups() =================

    @Test
    @DisplayName("UTCID01 - Groups exist -> Page of non-deleted groups ordered by newest")
    void utcid01_listGroups_ok() {
        // Given
        Page<CommunityGroup> groupPage = new PageImpl<>(List.of(group1, group2), PageRequest.of(0, 12), 2);
        when(groupRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(groupPage);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(memberRepository.findByUserIdAndGroupIdIn(eq(USER_ID), anyList())).thenReturn(List.of(member1));

        // When
        PageResponse<GroupCardResponse> response = groupService.listGroups(USER_EMAIL, null, null, 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        assertThat(response.getContent().get(0).getId()).isEqualTo(GROUP_ID_1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Java Developers Club");
        assertThat(response.getContent().get(0).getViewerMembershipStatus()).isEqualTo("ACTIVE");
        assertThat(response.getContent().get(1).getId()).isEqualTo(GROUP_ID_2);
        assertThat(response.getContent().get(1).getViewerMembershipStatus()).isEqualTo("NONE");
    }

    @Test
    @DisplayName("UTCID02 - Keyword 'java' provided -> Only groups matching keyword returned")
    void utcid02_listGroups_okKeyword() {
        // Given
        Page<CommunityGroup> groupPage = new PageImpl<>(List.of(group1), PageRequest.of(0, 12), 1);
        when(groupRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(groupPage);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(memberRepository.findByUserIdAndGroupIdIn(eq(USER_ID), anyList())).thenReturn(List.of(member1));

        // When
        PageResponse<GroupCardResponse> response = groupService.listGroups(USER_EMAIL, "java", null, 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Java Developers Club");
    }

    @Test
    @DisplayName("UTCID03 - Category 'technology' provided -> Only groups of category returned")
    void utcid03_listGroups_okCategory() {
        // Given
        Page<CommunityGroup> groupPage = new PageImpl<>(List.of(group1), PageRequest.of(0, 12), 1);
        when(groupRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(groupPage);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(memberRepository.findByUserIdAndGroupIdIn(eq(USER_ID), anyList())).thenReturn(List.of());

        // When
        PageResponse<GroupCardResponse> response = groupService.listGroups(USER_EMAIL, null, "technology", 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getCategory()).isEqualTo("technology");
    }

    @Test
    @DisplayName("UTCID04 - No group exists -> Empty page returned")
    void utcid04_listGroups_okEmpty() {
        // Given
        Page<CommunityGroup> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 12), 0);
        when(groupRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));

        // When
        PageResponse<GroupCardResponse> response = groupService.listGroups(USER_EMAIL, null, null, 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isZero();
    }

    // ================= getMyGroups() =================

    @Test
    @DisplayName("UTCID05 - User joined 2 groups -> 2 groups returned")
    void utcid05_getMyGroups_ok() {
        // Given
        Page<GroupMember> memberPage = new PageImpl<>(List.of(member1, member2), PageRequest.of(0, 12), 2);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(memberRepository.findMyGroups(eq(USER_ID), any(Pageable.class))).thenReturn(memberPage);

        // When
        PageResponse<GroupCardResponse> response = groupService.getMyGroups(USER_EMAIL, 0, 12);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Java Developers Club");
        assertThat(response.getContent().get(1).getName()).isEqualTo("Sports Club");
    }

    // ================= getGroupDetail() =================

    @Test
    @DisplayName("UTCID06 - Group exists and user is a member -> GroupDetailResponse with membership and member count")
    void utcid06_getGroupDetail_ok() {
        // Given
        when(groupRepository.findVisibleById(GROUP_ID_1)).thenReturn(Optional.of(group1));
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID_1, USER_ID)).thenReturn(Optional.of(member1));
        when(userProfileRepository.findById(OWNER_ID)).thenReturn(Optional.of(ownerProfile));
        when(conversationRepository.findByCommunityGroupId(GROUP_ID_1)).thenReturn(Optional.empty());

        // When
        GroupDetailResponse response = groupService.getGroupDetail(GROUP_ID_1, USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(GROUP_ID_1);
        assertThat(response.getName()).isEqualTo("Java Developers Club");
        assertThat(response.getMemberCount()).isEqualTo(15);
        assertThat(response.getViewerMembershipStatus()).isEqualTo("ACTIVE");
        assertThat(response.getViewerRole()).isEqualTo("MEMBER");
        assertThat(response.getOwner()).isNotNull();
        assertThat(response.getOwner().getFullName()).isEqualTo("Nguyen Van Owner");
    }

    @Test
    @DisplayName("UTCID07 - Group id 99 does not exist -> ResourceNotFoundException")
    void utcid07_getGroupDetail_notFound() {
        // Given
        when(groupRepository.findVisibleById(NON_EXISTENT_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> groupService.getGroupDetail(NON_EXISTENT_ID, USER_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy hội nhóm.");
        verify(groupRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - Group is deleted -> ResourceNotFoundException")
    void utcid08_getGroupDetail_notFoundDeleted() {
        // Given
        when(groupRepository.findVisibleById(DELETED_GROUP_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> groupService.getGroupDetail(DELETED_GROUP_ID, USER_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy hội nhóm.");
        verify(groupRepository, never()).save(any());
    }
}
