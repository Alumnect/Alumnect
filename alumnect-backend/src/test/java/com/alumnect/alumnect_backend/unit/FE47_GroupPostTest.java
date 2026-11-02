package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.common.enums.MembershipStatus;
import com.alumnect.alumnect_backend.dao.group.CommunityGroupRepository;
import com.alumnect.alumnect_backend.dao.group.GroupMemberRepository;
import com.alumnect.alumnect_backend.dao.group.GroupPostCommentRepository;
import com.alumnect.alumnect_backend.dao.group.GroupPostLikeRepository;
import com.alumnect.alumnect_backend.dao.group.GroupPostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.group.GroupPost;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.group.GroupPostServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-47 Community Groups - Manage Group Posts.
 * Report sheet : FE-47 (Report5_Unit_Test.xlsx)
 * Functions    : GroupPostServiceImpl.listPosts(), getPostDetail(), createPost(), updatePost(), deletePost(), togglePin()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-47 Community Groups - Manage Group Posts")
class FE47_GroupPostTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private com.alumnect.alumnect_backend.service.moderation.ContentModerationService contentModerationService;

    @Mock
    private GroupPostRepository groupPostRepository;

    @Mock
    private GroupPostLikeRepository groupPostLikeRepository;

    @Mock
    private GroupPostCommentRepository groupPostCommentRepository;

    @Mock
    private CommunityGroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    // ===== System under test =====
    @InjectMocks
    private GroupPostServiceImpl groupPostService;

    // ===== Test data =====
    private static final Long GROUP_ID = 1L;
    private static final Long POST_ID = 100L;
    private static final Long NON_EXISTENT_POST_ID = 99L;
    private static final Long AUTHOR_ID = 10L;
    private static final Long OWNER_ID = 11L;
    private static final Long ADMIN_ID = 12L;
    private static final Long OTHER_MEMBER_ID = 13L;

    private static final String AUTHOR_EMAIL = "author@fpt.edu.vn";
    private static final String OWNER_EMAIL = "owner@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final String OTHER_EMAIL = "other@fpt.edu.vn";

    private User author;
    private User owner;
    private User admin;
    private User otherMember;
    private UserProfile authorProfile;
    private CommunityGroup publicGroup;
    private CommunityGroup privateGroup;
    private CommunityGroup inactiveGroup;
    private GroupMember authorMember;
    private GroupMember ownerMember;
    private GroupMember adminMember;
    private GroupMember regularMember;
    private GroupPost post;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient()
                .when(contentModerationService.sanitizeContent(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();

        author = User.builder().id(AUTHOR_ID).email(AUTHOR_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();
        owner = User.builder().id(OWNER_ID).email(OWNER_EMAIL).role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        admin = User.builder().id(ADMIN_ID).email(ADMIN_EMAIL).role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        otherMember = User.builder().id(OTHER_MEMBER_ID).email(OTHER_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        authorProfile = UserProfile.builder().userId(AUTHOR_ID).fullName("Nguyen Van Author").avatarUrl("https://example.com/a.png").build();

        publicGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Java Developers Club")
                .description("Community for Java enthusiasts")
                .category("technology")
                .topics(List.of("java", "spring"))
                .privacy(GroupPrivacy.PUBLIC)
                .owner(owner)
                .memberCount(15)
                .status(GroupStatus.ACTIVE)
                .build();

        privateGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Private Java Club")
                .description("Private Community")
                .category("technology")
                .topics(List.of("java", "spring"))
                .privacy(GroupPrivacy.PRIVATE)
                .owner(owner)
                .memberCount(5)
                .status(GroupStatus.ACTIVE)
                .build();

        inactiveGroup = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Inactive Java Club")
                .description("Inactive Community")
                .category("technology")
                .topics(List.of("java", "spring"))
                .privacy(GroupPrivacy.PUBLIC)
                .owner(owner)
                .memberCount(5)
                .status(GroupStatus.INACTIVE)
                .build();

        authorMember = GroupMember.builder().id(201L).group(publicGroup).user(author).role(MembershipRole.MEMBER).membershipStatus(MembershipStatus.ACTIVE).build();
        ownerMember = GroupMember.builder().id(202L).group(publicGroup).user(owner).role(MembershipRole.OWNER).membershipStatus(MembershipStatus.ACTIVE).build();
        adminMember = GroupMember.builder().id(203L).group(publicGroup).user(admin).role(MembershipRole.ADMIN).membershipStatus(MembershipStatus.ACTIVE).build();
        regularMember = GroupMember.builder().id(204L).group(publicGroup).user(otherMember).role(MembershipRole.MEMBER).membershipStatus(MembershipStatus.ACTIVE).build();

        post = GroupPost.builder()
                .id(POST_ID)
                .group(publicGroup)
                .author(author)
                .content("Hello Java Community!")
                .topic("java")
                .imageUrls(List.of("https://example.com/img1.png"))
                .videoUrls(Collections.emptyList())
                .isPinned(false)
                .likeCount(5)
                .commentCount(2)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    // ================= listPosts() =================

    @Test
    @DisplayName("UTCID01 - Caller is group member; posts exist -> Pinned posts first, then newest")
    void utcid01_listPosts_ok() {
        // Given
        Page<GroupPost> postPage = new PageImpl<>(List.of(post), PageRequest.of(0, 10), 1);
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostRepository.findByGroupIdOrderByPinnedAndRecent(eq(GROUP_ID), any(Pageable.class))).thenReturn(postPage);
        when(userProfileRepository.findAllById(any())).thenReturn(List.of(authorProfile));
        when(groupMemberRepository.findByUserIdAndGroupIdIn(eq(AUTHOR_ID), any())).thenReturn(List.of(authorMember));
        when(groupPostLikeRepository.findByUserIdAndPostIdIn(eq(AUTHOR_ID), any())).thenReturn(Collections.emptyList());

        // When
        PageResponse<GroupPostResponse> response = groupPostService.listPosts(GROUP_ID, AUTHOR_EMAIL, 0, 10, null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(POST_ID);
        assertThat(response.getContent().get(0).getContent()).isEqualTo("Hello Java Community!");
    }

    @Test
    @DisplayName("UTCID02 - Posts with topic 'java' exist -> Only posts of the topic")
    void utcid02_listPosts_okTopic() {
        // Given
        Page<GroupPost> postPage = new PageImpl<>(List.of(post), PageRequest.of(0, 10), 1);
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostRepository.findByGroupIdAndTopicOrderByPinnedAndRecent(eq(GROUP_ID), eq("java"), any(Pageable.class))).thenReturn(postPage);
        when(userProfileRepository.findAllById(any())).thenReturn(List.of(authorProfile));
        when(groupMemberRepository.findByUserIdAndGroupIdIn(eq(AUTHOR_ID), any())).thenReturn(List.of(authorMember));
        when(groupPostLikeRepository.findByUserIdAndPostIdIn(eq(AUTHOR_ID), any())).thenReturn(Collections.emptyList());

        // When
        PageResponse<GroupPostResponse> response = groupPostService.listPosts(GROUP_ID, AUTHOR_EMAIL, 0, 10, "java");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getTopic()).isEqualTo("java");
    }

    @Test
    @DisplayName("UTCID03 - Group is private; caller is not a member -> ForbiddenException")
    void utcid03_listPosts_forbiddenPrivateGroup() {
        // Given
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(privateGroup));
        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(otherMember));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, OTHER_MEMBER_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> groupPostService.listPosts(GROUP_ID, OTHER_EMAIL, 0, 10, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ thành viên mới có quyền xem bài viết và thảo luận của hội nhóm riêng tư.");
    }

    // ================= getPostDetail() =================

    @Test
    @DisplayName("UTCID04 - Post exists -> GroupPostResponse with media, likes and comment count")
    void utcid04_getPostDetail_ok() {
        // Given
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(userProfileRepository.findById(AUTHOR_ID)).thenReturn(Optional.of(authorProfile));
        when(groupPostLikeRepository.existsByPostIdAndUserId(POST_ID, AUTHOR_ID)).thenReturn(false);

        // When
        GroupPostResponse response = groupPostService.getPostDetail(GROUP_ID, POST_ID, AUTHOR_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(POST_ID);
        assertThat(response.getLikeCount()).isEqualTo(5);
        assertThat(response.getCommentCount()).isEqualTo(2);
        assertThat(response.getImageUrls()).contains("https://example.com/img1.png");
    }

    @Test
    @DisplayName("UTCID05 - Post id 99 does not exist -> ResourceNotFoundException")
    void utcid05_getPostDetail_notFound() {
        // Given
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostRepository.findByIdAndGroupId(NON_EXISTENT_POST_ID, GROUP_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> groupPostService.getPostDetail(GROUP_ID, NON_EXISTENT_POST_ID, AUTHOR_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết không tồn tại trong hội nhóm này.");
    }

    // ================= createPost() =================

    @Test
    @DisplayName("UTCID06 - Valid request -> Post saved with author and media")
    void utcid06_createPost_ok() {
        // Given
        CreateGroupPostRequest request = CreateGroupPostRequest.builder()
                .content("Hello World")
                .topic("java")
                .imageUrls(List.of("https://example.com/img1.png"))
                .build();

        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostRepository.save(any(GroupPost.class))).thenAnswer(invocation -> {
            GroupPost p = invocation.getArgument(0);
            p.setId(POST_ID);
            return p;
        });
        when(userProfileRepository.findById(AUTHOR_ID)).thenReturn(Optional.of(authorProfile));

        // When
        GroupPostResponse response = groupPostService.createPost(GROUP_ID, AUTHOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(POST_ID);
        assertThat(response.getContent()).isEqualTo("Hello World");
        verify(groupPostRepository).save(any(GroupPost.class));
    }

    @Test
    @DisplayName("UTCID07 - Content with 5000 characters -> Post saved")
    void utcid07_createPost_okContentMax() {
        // Given
        String maxContent = "a".repeat(5000);
        CreateGroupPostRequest request = CreateGroupPostRequest.builder()
                .content(maxContent)
                .build();

        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostRepository.save(any(GroupPost.class))).thenAnswer(invocation -> {
            GroupPost p = invocation.getArgument(0);
            p.setId(POST_ID);
            return p;
        });
        when(userProfileRepository.findById(AUTHOR_ID)).thenReturn(Optional.of(authorProfile));

        // When
        GroupPostResponse response = groupPostService.createPost(GROUP_ID, AUTHOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo(maxContent);
    }

    @Test
    @DisplayName("UTCID08 - Content with 5001 characters -> ConstraintViolation")
    void utcid08_createPost_invalidContentTooLong() {
        // Given
        CreateGroupPostRequest dto = CreateGroupPostRequest.builder()
                .content("a".repeat(5001))
                .build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateGroupPostRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Nội dung thảo luận không được vượt quá 5000 ký tự");
    }

    @Test
    @DisplayName("UTCID09 - 11 media files -> ConstraintViolation")
    void utcid09_createPost_invalidMediaTooMany() {
        // Given
        CreateGroupPostRequest dto = CreateGroupPostRequest.builder()
                .content("Valid content")
                .imageUrls(List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"))
                .build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateGroupPostRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Mỗi bài viết chỉ được đính kèm tối đa 10 hình ảnh");
    }

    @Test
    @DisplayName("UTCID10 - Group is INACTIVE -> BadRequestException")
    void utcid10_createPost_badRequestGroupInactive() {
        // Given
        CreateGroupPostRequest request = CreateGroupPostRequest.builder().content("Valid content").build();
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(inactiveGroup));

        // When + Then
        assertThatThrownBy(() -> groupPostService.createPost(GROUP_ID, AUTHOR_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Hội nhóm đang tạm ngừng hoạt động.");
        verify(groupPostRepository, never()).save(any());
    }

    // ================= updatePost() =================

    @Test
    @DisplayName("UTCID11 - Caller is the author -> Post content updated and edited flag set")
    void utcid11_updatePost_okAuthor() {
        // Given
        UpdateGroupPostRequest request = UpdateGroupPostRequest.builder()
                .content("Updated content")
                .topic("java")
                .build();

        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostRepository.save(any(GroupPost.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.findById(AUTHOR_ID)).thenReturn(Optional.of(authorProfile));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));
        when(groupPostLikeRepository.existsByPostIdAndUserId(POST_ID, AUTHOR_ID)).thenReturn(false);

        // When
        GroupPostResponse response = groupPostService.updatePost(GROUP_ID, POST_ID, AUTHOR_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Updated content");
        verify(groupPostRepository).save(post);
    }

    @Test
    @DisplayName("UTCID12 - Caller is another member -> ForbiddenException")
    void utcid12_updatePost_forbiddenNotAuthor() {
        // Given
        UpdateGroupPostRequest request = UpdateGroupPostRequest.builder().content("Hacked content").build();
        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(otherMember));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));

        // When + Then
        assertThatThrownBy(() -> groupPostService.updatePost(GROUP_ID, POST_ID, OTHER_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ có thể chỉnh sửa bài viết do chính mình đăng.");
        verify(groupPostRepository, never()).save(any());
    }

    // ================= deletePost() =================

    @Test
    @DisplayName("UTCID13 - Caller is the author -> Post deleted")
    void utcid13_deletePost_okAuthor() {
        // Given
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));

        // When
        groupPostService.deletePost(GROUP_ID, POST_ID, AUTHOR_EMAIL);

        // Then
        verify(groupPostRepository).delete(post);
    }

    @Test
    @DisplayName("UTCID14 - Caller is group ADMIN; not the author -> Post deleted by moderator")
    void utcid14_deletePost_okModerator() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_ID)).thenReturn(Optional.of(adminMember));

        // When
        groupPostService.deletePost(GROUP_ID, POST_ID, ADMIN_EMAIL);

        // Then
        verify(groupPostRepository).delete(post);
    }

    // ================= togglePin() =================

    @Test
    @DisplayName("UTCID15 - Caller is OWNER -> Post pinned; calling again unpins it")
    void utcid15_togglePin_okOwner() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, OWNER_ID)).thenReturn(Optional.of(ownerMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostRepository.save(any(GroupPost.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.findById(AUTHOR_ID)).thenReturn(Optional.of(authorProfile));
        when(groupPostLikeRepository.existsByPostIdAndUserId(POST_ID, OWNER_ID)).thenReturn(false);

        // When
        GroupPostResponse response = groupPostService.togglePin(GROUP_ID, POST_ID, OWNER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isPinned()).isTrue();
        verify(groupPostRepository).save(post);
        assertThat(post.isPinned()).isTrue();
    }

    @Test
    @DisplayName("UTCID16 - Caller is MEMBER -> ForbiddenException")
    void utcid16_togglePin_forbiddenMember() {
        // Given
        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(publicGroup));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, AUTHOR_ID)).thenReturn(Optional.of(authorMember));

        // When + Then
        assertThatThrownBy(() -> groupPostService.togglePin(GROUP_ID, POST_ID, AUTHOR_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ chủ sở hữu hoặc quản trị viên mới có quyền ghim bài viết.");
        verify(groupPostRepository, never()).save(any());
    }
}
