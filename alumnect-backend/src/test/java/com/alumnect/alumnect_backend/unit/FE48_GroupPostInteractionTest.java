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
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupCommentResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostLikeResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.group.GroupPost;
import com.alumnect.alumnect_backend.entity.group.GroupPostComment;
import com.alumnect.alumnect_backend.entity.group.GroupPostLike;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
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
 * FE-48 Community Groups - Like & Comment on Group Posts.
 * Report sheet : FE-48 (Report5_Unit_Test.xlsx)
 * Functions    : GroupPostServiceImpl.toggleLike(), listComments(), createComment(), updateComment(), deleteComment()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-48 Community Groups - Like & Comment on Group Posts")
class FE48_GroupPostInteractionTest {

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
    private static final Long COMMENT_ID = 200L;
    private static final Long PARENT_COMMENT_ID = 199L;

    private static final Long USER_ID = 10L;
    private static final Long AUTHOR_ID = 11L;
    private static final Long ADMIN_ID = 12L;
    private static final Long OTHER_USER_ID = 13L;

    private static final String USER_EMAIL = "member@fpt.edu.vn";
    private static final String AUTHOR_EMAIL = "author@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final String OTHER_EMAIL = "other@fpt.edu.vn";

    private User user;
    private User author;
    private User admin;
    private User otherUser;
    private UserProfile userProfile;
    private CommunityGroup group;
    private GroupMember userMember;
    private GroupMember adminMember;
    private GroupPost post;
    private GroupPostComment rootComment;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient()
                .when(contentModerationService.sanitizeContent(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();

        user = User.builder().id(USER_ID).email(USER_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();
        author = User.builder().id(AUTHOR_ID).email(AUTHOR_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();
        admin = User.builder().id(ADMIN_ID).email(ADMIN_EMAIL).role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        otherUser = User.builder().id(OTHER_USER_ID).email(OTHER_EMAIL).role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        userProfile = UserProfile.builder().userId(USER_ID).fullName("Nguyen Van Member").avatarUrl("https://example.com/m.png").build();

        group = CommunityGroup.builder()
                .id(GROUP_ID)
                .name("Java Developers Club")
                .description("Community for Java enthusiasts")
                .category("technology")
                .privacy(GroupPrivacy.PUBLIC)
                .owner(admin)
                .memberCount(15)
                .status(GroupStatus.ACTIVE)
                .build();

        userMember = GroupMember.builder().id(301L).group(group).user(user).role(MembershipRole.MEMBER).membershipStatus(MembershipStatus.ACTIVE).build();
        adminMember = GroupMember.builder().id(302L).group(group).user(admin).role(MembershipRole.ADMIN).membershipStatus(MembershipStatus.ACTIVE).build();

        post = GroupPost.builder()
                .id(POST_ID)
                .group(group)
                .author(author)
                .content("Hello Java Community!")
                .likeCount(5)
                .commentCount(2)
                .isPinned(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        rootComment = GroupPostComment.builder()
                .id(COMMENT_ID)
                .post(post)
                .author(user)
                .content("Great post!")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    // ================= toggleLike() =================

    @Test
    @DisplayName("UTCID01 - User has not liked the post -> Like saved; like count +1")
    void utcid01_toggleLike_okLiked() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostLikeRepository.findByPostIdAndUserId(POST_ID, USER_ID)).thenReturn(Optional.empty());

        // When
        GroupPostLikeResponse response = groupPostService.toggleLike(GROUP_ID, POST_ID, USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isLiked()).isTrue();
        assertThat(response.getLikeCount()).isEqualTo(6);
        verify(groupPostLikeRepository).save(any(GroupPostLike.class));
        verify(groupPostRepository).incrementLikeCount(POST_ID);
    }

    @Test
    @DisplayName("UTCID02 - User already liked the post -> Like removed; like count -1")
    void utcid02_toggleLike_okUnliked() {
        // Given
        GroupPostLike existingLike = GroupPostLike.builder().id(401L).post(post).user(user).build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostLikeRepository.findByPostIdAndUserId(POST_ID, USER_ID)).thenReturn(Optional.of(existingLike));

        // When
        GroupPostLikeResponse response = groupPostService.toggleLike(GROUP_ID, POST_ID, USER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isLiked()).isFalse();
        assertThat(response.getLikeCount()).isEqualTo(4);
        verify(groupPostLikeRepository).delete(existingLike);
        verify(groupPostRepository).decrementLikeCount(POST_ID);
    }

    @Test
    @DisplayName("UTCID03 - Post id 99 does not exist -> ResourceNotFoundException")
    void utcid03_toggleLike_notFound() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(NON_EXISTENT_POST_ID, GROUP_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> groupPostService.toggleLike(GROUP_ID, NON_EXISTENT_POST_ID, USER_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết không tồn tại trong hội nhóm này.");
        verify(groupPostLikeRepository, never()).save(any());
    }

    // ================= listComments() =================

    @Test
    @DisplayName("UTCID04 - Post has root comments and replies -> Root comments with nested replies")
    void utcid04_listComments_ok() {
        // Given
        Page<GroupPostComment> commentPage = new PageImpl<>(List.of(rootComment), PageRequest.of(0, 10), 1);

        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostCommentRepository.findByPostIdOrderByCreatedAtAsc(eq(POST_ID), any(Pageable.class))).thenReturn(commentPage);
        when(userProfileRepository.findAllById(any())).thenReturn(List.of(userProfile));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));

        // When
        PageResponse<GroupCommentResponse> response = groupPostService.listComments(GROUP_ID, POST_ID, USER_EMAIL, 0, 10);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(COMMENT_ID);
        assertThat(response.getContent().get(0).getContent()).isEqualTo("Great post!");
    }

    // ================= createComment() =================

    @Test
    @DisplayName("UTCID05 - Caller is member -> Comment saved and count +1")
    void utcid05_createComment_okRoot() {
        // Given
        CreateGroupCommentRequest request = CreateGroupCommentRequest.builder().content("Nice post!").build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostCommentRepository.save(any(GroupPostComment.class))).thenAnswer(invocation -> {
            GroupPostComment c = invocation.getArgument(0);
            c.setId(COMMENT_ID);
            return c;
        });
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userProfile));

        // When
        GroupCommentResponse response = groupPostService.createComment(GROUP_ID, POST_ID, USER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(COMMENT_ID);
        assertThat(response.getContent()).isEqualTo("Nice post!");
        verify(groupPostCommentRepository).save(any(GroupPostComment.class));
        verify(groupPostRepository).incrementCommentCount(POST_ID);
    }

    @Test
    @DisplayName("UTCID06 - Parent comment exists -> Reply saved under the parent")
    void utcid06_createComment_okReply() {
        // Given
        CreateGroupCommentRequest request = CreateGroupCommentRequest.builder().content("I agree!").parentId(PARENT_COMMENT_ID).build();
        GroupPostComment parentComment = GroupPostComment.builder().id(PARENT_COMMENT_ID).post(post).author(author).content("Root").build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostCommentRepository.findByIdAndPostId(PARENT_COMMENT_ID, POST_ID)).thenReturn(Optional.of(parentComment));
        when(groupPostCommentRepository.save(any(GroupPostComment.class))).thenAnswer(invocation -> {
            GroupPostComment c = invocation.getArgument(0);
            c.setId(201L);
            return c;
        });
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userProfile));

        // When
        GroupCommentResponse response = groupPostService.createComment(GROUP_ID, POST_ID, USER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getParentId()).isEqualTo(PARENT_COMMENT_ID);
        verify(groupPostCommentRepository).save(any(GroupPostComment.class));
    }

    @Test
    @DisplayName("UTCID07 - Content with 1000 characters -> Comment saved")
    void utcid07_createComment_okContentMax() {
        // Given
        String maxContent = "a".repeat(1000);
        CreateGroupCommentRequest request = CreateGroupCommentRequest.builder().content(maxContent).build();

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));
        when(groupPostRepository.findByIdAndGroupId(POST_ID, GROUP_ID)).thenReturn(Optional.of(post));
        when(groupPostCommentRepository.save(any(GroupPostComment.class))).thenAnswer(invocation -> {
            GroupPostComment c = invocation.getArgument(0);
            c.setId(COMMENT_ID);
            return c;
        });
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userProfile));

        // When
        GroupCommentResponse response = groupPostService.createComment(GROUP_ID, POST_ID, USER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo(maxContent);
    }

    @Test
    @DisplayName("UTCID08 - Content with 1001 characters -> ConstraintViolation")
    void utcid08_createComment_invalidContentTooLong() {
        // Given
        CreateGroupCommentRequest dto = CreateGroupCommentRequest.builder().content("a".repeat(1001)).build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateGroupCommentRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Nội dung bình luận không được vượt quá 1000 ký tự");
    }

    @Test
    @DisplayName("UTCID09 - Content blank -> ConstraintViolation")
    void utcid09_createComment_invalidContentBlank() {
        // Given
        CreateGroupCommentRequest dto = CreateGroupCommentRequest.builder().content("   ").build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateGroupCommentRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Nội dung bình luận không được để trống");
    }

    // ================= updateComment() =================

    @Test
    @DisplayName("UTCID10 - Caller is the author -> Comment content updated")
    void utcid10_updateComment_okAuthor() {
        // Given
        UpdateGroupCommentRequest request = new UpdateGroupCommentRequest();
        request.setContent("Edited comment");

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupPostCommentRepository.findByIdAndPostId(COMMENT_ID, POST_ID)).thenReturn(Optional.of(rootComment));
        when(groupPostCommentRepository.save(any(GroupPostComment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userProfile));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, USER_ID)).thenReturn(Optional.of(userMember));

        // When
        GroupCommentResponse response = groupPostService.updateComment(GROUP_ID, POST_ID, COMMENT_ID, USER_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Edited comment");
        verify(groupPostCommentRepository).save(rootComment);
    }

    @Test
    @DisplayName("UTCID11 - Caller is not the author -> ForbiddenException")
    void utcid11_updateComment_forbiddenNotAuthor() {
        // Given
        UpdateGroupCommentRequest request = new UpdateGroupCommentRequest();
        request.setContent("Malicious update");

        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(otherUser));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupPostCommentRepository.findByIdAndPostId(COMMENT_ID, POST_ID)).thenReturn(Optional.of(rootComment));

        // When + Then
        assertThatThrownBy(() -> groupPostService.updateComment(GROUP_ID, POST_ID, COMMENT_ID, OTHER_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ có thể chỉnh sửa bình luận do chính mình đăng.");
        verify(groupPostCommentRepository, never()).save(any());
    }

    // ================= deleteComment() =================

    @Test
    @DisplayName("UTCID12 - Caller is the author -> Comment deleted and count decreased")
    void utcid12_deleteComment_okAuthor() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupPostCommentRepository.findByIdAndPostId(COMMENT_ID, POST_ID)).thenReturn(Optional.of(rootComment));
        when(groupPostCommentRepository.countByParentComment_Id(COMMENT_ID)).thenReturn(0L);

        // When
        groupPostService.deleteComment(GROUP_ID, POST_ID, COMMENT_ID, USER_EMAIL);

        // Then
        verify(groupPostCommentRepository).delete(rootComment);
        verify(groupPostRepository).decrementCommentCount(POST_ID, 1);
    }

    @Test
    @DisplayName("UTCID13 - Caller is group ADMIN -> Comment deleted by moderator")
    void utcid13_deleteComment_okModerator() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
        when(groupRepository.findVisibleById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupPostCommentRepository.findByIdAndPostId(COMMENT_ID, POST_ID)).thenReturn(Optional.of(rootComment));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, ADMIN_ID)).thenReturn(Optional.of(adminMember));
        when(groupPostCommentRepository.countByParentComment_Id(COMMENT_ID)).thenReturn(0L);

        // When
        groupPostService.deleteComment(GROUP_ID, POST_ID, COMMENT_ID, ADMIN_EMAIL);

        // Then
        verify(groupPostCommentRepository).delete(rootComment);
        verify(groupPostRepository).decrementCommentCount(POST_ID, 1);
    }
}
