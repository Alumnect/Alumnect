package com.alumnect.alumnect_backend.unit;

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
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupActionResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupDetailResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.group.GroupMapper;
import com.alumnect.alumnect_backend.service.group.GroupServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-44 Community Groups - Create, Update, Close/Reopen & Delete.
 * Report sheet : FE-44 (Report5_Unit_Test.xlsx)
 * Functions    : GroupServiceImpl.createGroup(), updateGroup(), updateGroupStatus(), deleteGroup()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-44 Community Groups - Create, Update, Close/Reopen & Delete")
class FE44_CommunityGroupManageTest {

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
    private static final String USER_EMAIL = "student@fpt.edu.vn";
    private static final String OWNER_EMAIL = "owner@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "groupadmin@fpt.edu.vn";

    private User user;
    private User owner;
    private User adminUser;
    private UserProfile userProfile;
    private UserProfile ownerProfile;
    private CommunityGroup activeGroup;
    private CommunityGroup inactiveGroup;
    private GroupMember ownerMember;
    private GroupMember regularMember;
    private GroupMember adminMember;

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

        userProfile = UserProfile.builder()
                .userId(USER_ID)
                .user(user)
                .fullName("Nguyen Van Sinh Vien")
                .avatarUrl("https://example.com/student.png")
                .build();

        ownerProfile = UserProfile.builder()
                .userId(OWNER_ID)
                .user(owner)
                .fullName("Nguyen Van Owner")
                .avatarUrl("https://example.com/owner.png")
                .build();

        activeGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Java Developers Club")
                .description("Community for Java enthusiasts")
                .category("technology")
                .topics(List.of("java", "spring"))
                .privacy(GroupPrivacy.PUBLIC)
                .joinRules("Be nice")
                .owner(owner)
                .memberCount(15)
                .status(GroupStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        inactiveGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Java Developers Club")
                .description("Community for Java enthusiasts")
                .category("technology")
                .topics(List.of("java", "spring"))
                .privacy(GroupPrivacy.PUBLIC)
                .joinRules("Be nice")
                .owner(owner)
                .memberCount(15)
                .status(GroupStatus.INACTIVE)
                .createdAt(Instant.now())
                .build();

        ownerMember = GroupMember.builder()
                .id(101L)
                .group(activeGroup)
                .user(owner)
                .role(MembershipRole.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        regularMember = GroupMember.builder()
                .id(102L)
                .group(activeGroup)
                .user(user)
                .role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        adminMember = GroupMember.builder()
                .id(103L)
                .group(activeGroup)
                .user(adminUser)
                .role(MembershipRole.ADMIN)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();
    }

    // ================= createGroup() =================

    @Test
    @DisplayName("UTCID01 - Valid request -> Group saved ACTIVE and creator becomes OWNER")
    void utcid01_createGroup_ok() {
        // Given
        CreateGroupRequest request = CreateGroupRequest.builder()
                .name("AI Club")
                .description("AI and Machine Learning enthusiasts")
                .category("technology")
                .topics(List.of("ai", "ml"))
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.save(any(CommunityGroup.class))).thenAnswer(invocation -> {
            CommunityGroup g = invocation.getArgument(0);
            g.setId(10L);
            return g;
        });
        when(memberRepository.save(any(GroupMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userProfile));
        when(conversationRepository.findByCommunityGroupId(10L)).thenReturn(Optional.empty());

        // When
        GroupDetailResponse response = groupService.createGroup(USER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("AI Club");
        assertThat(response.getStatus()).isEqualTo("ACTIVE");

        ArgumentCaptor<CommunityGroup> groupCaptor = ArgumentCaptor.forClass(CommunityGroup.class);
        verify(groupRepository).save(groupCaptor.capture());
        assertThat(groupCaptor.getValue().getStatus()).isEqualTo(GroupStatus.ACTIVE);
        assertThat(groupCaptor.getValue().getMemberCount()).isEqualTo(1);

        ArgumentCaptor<GroupMember> memberCaptor = ArgumentCaptor.forClass(GroupMember.class);
        verify(memberRepository).save(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getRole()).isEqualTo(MembershipRole.OWNER);
        assertThat(memberCaptor.getValue().getMembershipStatus()).isEqualTo(MembershipStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID02 - Name with 200 characters (maximum) -> Group created")
    void utcid02_createGroup_okNameMax() {
        // Given
        String maxName = "a".repeat(200);
        CreateGroupRequest request = CreateGroupRequest.builder()
                .name(maxName)
                .description("Valid description")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        Validator v = Validation.buildDefaultValidatorFactory().getValidator();
        Set<ConstraintViolation<CreateGroupRequest>> violations = v.validate(request);
        assertThat(violations).isEmpty();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.save(any(CommunityGroup.class))).thenAnswer(invocation -> {
            CommunityGroup g = invocation.getArgument(0);
            g.setId(10L);
            return g;
        });
        when(memberRepository.save(any(GroupMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userProfile));
        when(conversationRepository.findByCommunityGroupId(10L)).thenReturn(Optional.empty());

        // When
        GroupDetailResponse response = groupService.createGroup(USER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo(maxName);
    }

    @Test
    @DisplayName("UTCID03 - Name with 201 characters -> ConstraintViolation")
    void utcid03_createGroup_invalidNameTooLong() {
        // Given
        CreateGroupRequest dto = CreateGroupRequest.builder()
                .name("a".repeat(201))
                .description("Valid description")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateGroupRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Tên hội nhóm không được vượt quá 200 ký tự");
    }

    @Test
    @DisplayName("UTCID04 - Topics with 6 items -> ConstraintViolation")
    void utcid04_createGroup_invalidTopicsTooMany() {
        // Given
        CreateGroupRequest dto = CreateGroupRequest.builder()
                .name("AI Club")
                .description("Valid description")
                .category("technology")
                .topics(List.of("t1", "t2", "t3", "t4", "t5", "t6"))
                .privacy(GroupPrivacy.PUBLIC)
                .build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateGroupRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Chỉ được nhập tối đa 5 chủ đề");
    }

    // ================= updateGroup() =================

    @Test
    @DisplayName("UTCID05 - Caller is OWNER and group ACTIVE -> Group information updated")
    void utcid05_updateGroup_ok() {
        // Given
        UpdateGroupRequest request = UpdateGroupRequest.builder()
                .name("Updated Java Club")
                .description("Updated description")
                .category("technology")
                .topics(List.of("java", "backend"))
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(activeGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(userProfileRepository.findById(OWNER_ID)).thenReturn(Optional.of(ownerProfile));
        when(conversationRepository.findByCommunityGroupId(GROUP_ID)).thenReturn(Optional.empty());

        // When
        GroupDetailResponse response = groupService.updateGroup(GROUP_ID, OWNER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Updated Java Club");
        verify(groupRepository).save(activeGroup);
    }

    @Test
    @DisplayName("UTCID06 - Caller is MEMBER -> ForbiddenException")
    void utcid06_updateGroup_forbidden() {
        // Given
        UpdateGroupRequest request = UpdateGroupRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(activeGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(regularMember));

        // When + Then
        assertThatThrownBy(() -> groupService.updateGroup(GROUP_ID, USER_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền quản lý hội nhóm này.");
        verify(groupRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Group is INACTIVE -> BadRequestException")
    void utcid07_updateGroup_badRequest() {
        // Given
        UpdateGroupRequest request = UpdateGroupRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(inactiveGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));

        // When + Then
        assertThatThrownBy(() -> groupService.updateGroup(GROUP_ID, OWNER_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Hội nhóm đang tạm ngừng hoạt động.");
        verify(groupRepository, never()).save(any());
    }

    // ================= updateGroupStatus() =================

    @Test
    @DisplayName("UTCID08 - Caller is OWNER; group ACTIVE -> Group becomes INACTIVE")
    void utcid08_updateGroupStatus_okInactive() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(activeGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));

        // When
        GroupActionResponse response = groupService.updateGroupStatus(GROUP_ID, OWNER_EMAIL, GroupStatus.INACTIVE);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("INACTIVE");
        assertThat(response.getMessage()).isEqualTo("Đã đóng hội nhóm.");
        verify(groupRepository).save(activeGroup);
        assertThat(activeGroup.getStatus()).isEqualTo(GroupStatus.INACTIVE);
    }

    @Test
    @DisplayName("UTCID09 - Caller is OWNER; group INACTIVE -> Group becomes ACTIVE")
    void utcid09_updateGroupStatus_okActive() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(inactiveGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));

        // When
        GroupActionResponse response = groupService.updateGroupStatus(GROUP_ID, OWNER_EMAIL, GroupStatus.ACTIVE);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.getMessage()).isEqualTo("Đã mở lại hội nhóm.");
        verify(groupRepository).save(inactiveGroup);
        assertThat(inactiveGroup.getStatus()).isEqualTo(GroupStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID10 - Status is DELETED -> BadRequestException")
    void utcid10_updateGroupStatus_badRequest() {
        // Given (no mock needed - validation fails first)

        // When + Then
        assertThatThrownBy(() -> groupService.updateGroupStatus(GROUP_ID, OWNER_EMAIL, GroupStatus.DELETED))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ được đóng (INACTIVE) hoặc mở lại (ACTIVE) hội nhóm. Để xóa hãy dùng chức năng xóa hội nhóm.");
        verify(groupRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Caller is ADMIN (not owner) -> ForbiddenException")
    void utcid11_updateGroupStatus_forbidden() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(activeGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_USER_ID)).thenReturn(Optional.of(adminMember));

        // When + Then
        assertThatThrownBy(() -> groupService.updateGroupStatus(GROUP_ID, ADMIN_EMAIL, GroupStatus.INACTIVE))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ chủ sở hữu hội nhóm mới có quyền thực hiện thao tác này.");
        verify(groupRepository, never()).save(any());
    }

    // ================= deleteGroup() =================

    @Test
    @DisplayName("UTCID12 - Caller is OWNER -> Group soft-deleted")
    void utcid12_deleteGroup_ok() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(activeGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));

        // When
        GroupActionResponse response = groupService.deleteGroup(GROUP_ID, OWNER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("DELETED");
        assertThat(response.getMessage()).isEqualTo("Đã xóa hội nhóm.");
        verify(groupRepository).save(activeGroup);
        assertThat(activeGroup.getStatus()).isEqualTo(GroupStatus.DELETED);
    }

    @Test
    @DisplayName("UTCID13 - Caller is ADMIN (not owner) -> ForbiddenException")
    void utcid13_deleteGroup_forbidden() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(activeGroup));
        when(memberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_USER_ID)).thenReturn(Optional.of(adminMember));

        // When + Then
        assertThatThrownBy(() -> groupService.deleteGroup(GROUP_ID, ADMIN_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ chủ sở hữu hội nhóm mới có quyền thực hiện thao tác này.");
        verify(groupRepository, never()).save(any());
    }
}
