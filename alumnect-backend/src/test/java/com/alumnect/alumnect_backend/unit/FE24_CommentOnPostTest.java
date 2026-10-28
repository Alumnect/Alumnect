package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.CommentStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.CommentRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.CreateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.post.UpdateCommentRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.post.CommentMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
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
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-24 Comment on a Post.
 * Report sheet : FE-24 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.createComment(), getPostComments(), updateComment(), deleteComment()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-24 Comment on a Post")
class FE24_CommentOnPostTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private CommentMapper commentMapper;

    @Mock
    private NotificationService notificationService;

    // ===== System under test =====
    @InjectMocks
    private PostServiceImpl postService;

    // ===== Test data =====
    private static final Long POST_ID = 5L;
    private static final Long OTHER_POST_ID = 6L;
    private static final Long ROOT_COMMENT_ID = 10L;
    private static final Long REPLY_COMMENT_ID = 11L;
    private static final Long CHILD_REPLY_ID = 20L;
    private static final Long MISSING_COMMENT_ID = 404L;

    private static final Long MEMBER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long ADMIN_ID = 3L;

    private static final String MEMBER_EMAIL = "student@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";

    private User member;
    private User otherUser;
    private User admin;
    private Post activePost;
    private Post otherPost;
    private Post hiddenPost;
    private Comment rootComment;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        Role adminRole = Role.builder().id(3L).name("ADMIN").build();

        member = User.builder()
                .id(MEMBER_ID)
                .email(MEMBER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        otherUser = User.builder()
                .id(OTHER_USER_ID)
                .email("other@fpt.edu.vn")
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        admin = User.builder()
                .id(ADMIN_ID)
                .email(ADMIN_EMAIL)
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        activePost = Post.builder()
                .id(POST_ID)
                .author(otherUser)
                .category(PostCategory.GENERAL)
                .content("Active post 5")
                .status(PostStatus.ACTIVE)
                .commentCount(2)
                .build();

        otherPost = Post.builder()
                .id(OTHER_POST_ID)
                .author(otherUser)
                .category(PostCategory.GENERAL)
                .content("Active post 6")
                .status(PostStatus.ACTIVE)
                .build();

        hiddenPost = Post.builder()
                .id(POST_ID)
                .author(otherUser)
                .category(PostCategory.GENERAL)
                .content("Hidden post 5")
                .status(PostStatus.HIDDEN)
                .build();

        rootComment = Comment.builder()
                .id(ROOT_COMMENT_ID)
                .post(activePost)
                .user(member)
                .parentComment(null)
                .content("Root comment")
                .status(CommentStatus.ACTIVE)
                .build();
    }

    // ================= createComment() =================

    @Test
    @DisplayName("UTCID01 - Member comments on ACTIVE post 5 (parentId = null) -> Comment saved ACTIVE with trimmed content and notification sent")
    void utcid01_createComment_okRoot() {
        // Given
        CreateCommentRequest request = CreateCommentRequest.builder()
                .content("  Great post  ")
                .parentId(null)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(ROOT_COMMENT_ID);
            return c;
        });
        when(userProfileRepository.findById(MEMBER_ID)).thenReturn(Optional.empty());
        CommentResponse expected = CommentResponse.builder()
                .id(String.valueOf(ROOT_COMMENT_ID))
                .text("Great post")
                .parentId(null)
                .build();
        when(commentMapper.toResponse(any(Comment.class), any())).thenReturn(expected);

        // When
        CommentResponse response = postService.createComment(MEMBER_EMAIL, POST_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getText()).isEqualTo("Great post");
        assertThat(response.getParentId()).isNull();

        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(captor.capture());
        Comment saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(CommentStatus.ACTIVE);
        assertThat(saved.getContent()).isEqualTo("Great post");
        assertThat(saved.getParentComment()).isNull();
        assertThat(saved.getPost()).isEqualTo(activePost);
        assertThat(saved.getUser()).isEqualTo(member);

        verify(postRepository).incrementCommentCount(POST_ID);
        verify(notificationService).sendCommentNotification(eq(member), any(Comment.class), eq(activePost));
    }

    @Test
    @DisplayName("UTCID02 - Reply to comment 20 (child of root 10) -> Attached to root comment 10 (flattened)")
    void utcid02_createComment_okFlattenReply() {
        // Given
        Comment replyComment20 = Comment.builder()
                .id(CHILD_REPLY_ID)
                .post(activePost)
                .user(otherUser)
                .parentComment(rootComment)
                .content("Reply 20")
                .status(CommentStatus.ACTIVE)
                .build();
        CreateCommentRequest request = CreateCommentRequest.builder()
                .content("Reply to reply")
                .parentId(CHILD_REPLY_ID)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(commentRepository.findById(CHILD_REPLY_ID)).thenReturn(Optional.of(replyComment20));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(30L);
            return c;
        });
        when(userProfileRepository.findById(MEMBER_ID)).thenReturn(Optional.empty());
        CommentResponse expected = CommentResponse.builder()
                .id("30")
                .text("Reply to reply")
                .parentId(String.valueOf(ROOT_COMMENT_ID))
                .build();
        when(commentMapper.toResponse(any(Comment.class), any())).thenReturn(expected);

        // When
        CommentResponse response = postService.createComment(MEMBER_EMAIL, POST_ID, request);

        // Then
        assertThat(response.getParentId()).isEqualTo(String.valueOf(ROOT_COMMENT_ID));

        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(captor.capture());
        assertThat(captor.getValue().getParentComment()).isEqualTo(rootComment);
        verify(postRepository).incrementCommentCount(POST_ID);
    }

    @Test
    @DisplayName("UTCID03 - Parent comment id 404 does not exist -> ResourceNotFoundException")
    void utcid03_createComment_notFoundParent() {
        // Given
        CreateCommentRequest request = CreateCommentRequest.builder()
                .content("Reply content")
                .parentId(MISSING_COMMENT_ID)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(commentRepository.findById(MISSING_COMMENT_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> postService.createComment(MEMBER_EMAIL, POST_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bình luận cần trả lời không còn khả dụng");
        verify(commentRepository, never()).save(any());
        verify(postRepository, never()).incrementCommentCount(anyLong());
    }

    @Test
    @DisplayName("UTCID04 - Parent comment 20 belongs to different post (id 6) -> ResourceNotFoundException")
    void utcid04_createComment_notFoundOtherPost() {
        // Given
        Comment commentOnOtherPost = Comment.builder()
                .id(CHILD_REPLY_ID)
                .post(otherPost)
                .user(otherUser)
                .status(CommentStatus.ACTIVE)
                .build();
        CreateCommentRequest request = CreateCommentRequest.builder()
                .content("Reply content")
                .parentId(CHILD_REPLY_ID)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(commentRepository.findById(CHILD_REPLY_ID)).thenReturn(Optional.of(commentOnOtherPost));

        // When + Then
        assertThatThrownBy(() -> postService.createComment(MEMBER_EMAIL, POST_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bình luận cần trả lời không còn khả dụng");
        verify(commentRepository, never()).save(any());
        verify(postRepository, never()).incrementCommentCount(anyLong());
    }

    @Test
    @DisplayName("UTCID05 - Account role is ADMIN -> ForbiddenException")
    void utcid05_createComment_forbidden() {
        // Given
        CreateCommentRequest request = CreateCommentRequest.builder()
                .content("Admin comment")
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> postService.createComment(ADMIN_EMAIL, POST_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được bình luận");
        verify(commentRepository, never()).save(any());
        verify(postRepository, never()).incrementCommentCount(anyLong());
    }

    // ================= getPostComments() =================

    @Test
    @DisplayName("UTCID06 - Post 5 has 2 active comments (guest) -> PageResponse with 2 CommentResponse")
    void utcid06_getPostComments_ok() {
        // Given
        Comment c1 = Comment.builder().id(10L).post(activePost).user(member).content("C1").status(CommentStatus.ACTIVE).build();
        Comment c2 = Comment.builder().id(11L).post(activePost).user(otherUser).content("C2").status(CommentStatus.ACTIVE).build();
        Page<Comment> pageResult = new PageImpl<>(List.of(c1, c2), PageRequest.of(0, 10), 2);

        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(commentRepository.findActiveByPostId(POST_ID, PageRequest.of(0, 10))).thenReturn(pageResult);
        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(commentMapper.toResponse(eq(c1), any())).thenReturn(CommentResponse.builder().id("10").text("C1").build());
        when(commentMapper.toResponse(eq(c2), any())).thenReturn(CommentResponse.builder().id("11").text("C2").build());

        // When
        PageResponse<CommentResponse> response = postService.getPostComments(POST_ID, 0, 10, false);

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        assertThat(response.getPageNumber()).isZero();
        assertThat(response.getPageSize()).isEqualTo(10);
    }

    @Test
    @DisplayName("UTCID07 - page = -1 -> BadRequestException")
    void utcid07_getPostComments_badRequestPage() {
        // Given
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));

        // When + Then
        assertThatThrownBy(() -> postService.getPostComments(POST_ID, -1, 10, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
        verify(commentRepository, never()).findActiveByPostId(anyLong(), any());
    }

    @Test
    @DisplayName("UTCID08 - size = 0 -> BadRequestException")
    void utcid08_getPostComments_badRequestSize() {
        // Given
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));

        // When + Then
        assertThatThrownBy(() -> postService.getPostComments(POST_ID, 0, 0, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số size phải là số nguyên dương");
        verify(commentRepository, never()).findActiveByPostId(anyLong(), any());
    }

    // ================= updateComment() =================

    @Test
    @DisplayName("UTCID09 - Member owns ACTIVE comment 10 on post 5 -> CommentResponse with trimmed content saved")
    void utcid09_updateComment_ok() {
        // Given
        UpdateCommentRequest request = UpdateCommentRequest.builder()
                .content("  edited  ")
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userProfileRepository.findById(MEMBER_ID)).thenReturn(Optional.empty());
        when(commentMapper.toResponse(any(Comment.class), any()))
                .thenReturn(CommentResponse.builder().id("10").text("edited").build());

        // When
        CommentResponse response = postService.updateComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID, request);

        // Then
        assertThat(response.getText()).isEqualTo("edited");

        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(captor.capture());
        assertThat(captor.getValue().getContent()).isEqualTo("edited");
    }

    @Test
    @DisplayName("UTCID10 - Comment 10 belongs to another user (update) -> ForbiddenException")
    void utcid10_updateComment_forbidden() {
        // Given
        rootComment.setUser(otherUser);
        UpdateCommentRequest request = UpdateCommentRequest.builder()
                .content("edited")
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));

        // When + Then
        assertThatThrownBy(() -> postService.updateComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ được chỉnh sửa bình luận của chính mình");
        verify(commentRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Comment 10 belongs to post 6 but URL uses post 5 -> ResourceNotFoundException")
    void utcid11_updateComment_notFoundWrongPost() {
        // Given
        rootComment.setPost(otherPost);
        UpdateCommentRequest request = UpdateCommentRequest.builder()
                .content("edited")
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));

        // When + Then
        assertThatThrownBy(() -> postService.updateComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bình luận này không còn khả dụng");
        verify(commentRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID12 - Comment 10 has status DELETED -> ResourceNotFoundException")
    void utcid12_updateComment_notFoundDeleted() {
        // Given
        rootComment.setStatus(CommentStatus.DELETED);
        UpdateCommentRequest request = UpdateCommentRequest.builder()
                .content("edited")
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));

        // When + Then
        assertThatThrownBy(() -> postService.updateComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bình luận này không còn khả dụng");
        verify(commentRepository, never()).save(any());
    }

    // ================= deleteComment() =================

    @Test
    @DisplayName("UTCID13 - Member deletes root comment 10 with 2 ACTIVE replies -> Deleted and counter decremented by 3")
    void utcid13_deleteComment_okRoot() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));
        when(commentRepository.countByParentComment_IdAndStatus(ROOT_COMMENT_ID, CommentStatus.ACTIVE))
                .thenReturn(2L);

        // When
        postService.deleteComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID);

        // Then
        verify(commentRepository).delete(rootComment);
        verify(postRepository).decrementCommentCount(POST_ID, 3);
    }

    @Test
    @DisplayName("UTCID14 - Member deletes reply comment 11 -> Deleted and counter decremented by 1")
    void utcid14_deleteComment_okReply() {
        // Given
        Comment replyComment = Comment.builder()
                .id(REPLY_COMMENT_ID)
                .post(activePost)
                .user(member)
                .parentComment(rootComment)
                .content("Reply 11")
                .status(CommentStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(REPLY_COMMENT_ID)).thenReturn(Optional.of(replyComment));

        // When
        postService.deleteComment(MEMBER_EMAIL, POST_ID, REPLY_COMMENT_ID);

        // Then
        verify(commentRepository).delete(replyComment);
        verify(postRepository).decrementCommentCount(POST_ID, 1);
        verify(commentRepository, never()).countByParentComment_IdAndStatus(anyLong(), any());
    }

    @Test
    @DisplayName("UTCID15 - Comment 10 belongs to another user (delete) -> ForbiddenException")
    void utcid15_deleteComment_forbidden() {
        // Given
        rootComment.setUser(otherUser);
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));

        // When + Then
        assertThatThrownBy(() -> postService.deleteComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ được xóa bình luận của chính mình");
        verify(commentRepository, never()).delete(any());
        verify(postRepository, never()).decrementCommentCount(anyLong(), anyInt());
    }

    @Test
    @DisplayName("UTCID16 - Post of the comment is HIDDEN -> ResourceNotFoundException")
    void utcid16_deleteComment_notFoundHidden() {
        // Given
        rootComment.setPost(hiddenPost);
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(commentRepository.findById(ROOT_COMMENT_ID)).thenReturn(Optional.of(rootComment));

        // When + Then
        assertThatThrownBy(() -> postService.deleteComment(MEMBER_EMAIL, POST_ID, ROOT_COMMENT_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bình luận này không còn khả dụng");
        verify(commentRepository, never()).delete(any());
        verify(postRepository, never()).decrementCommentCount(anyLong(), anyInt());
    }

    @Test
    @DisplayName("UTCID17 - CreateCommentRequest content length 2000 (maximum) -> No constraint violation")
    void utcid17_createComment_okMaxLen() {
        // Given
        CreateCommentRequest dto = CreateCommentRequest.builder()
                .content("a".repeat(2000))
                .build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateCommentRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID18 - CreateCommentRequest content length 2001 (above maximum) -> ConstraintViolation")
    void utcid18_createComment_invalidTooLong() {
        // Given
        CreateCommentRequest dto = CreateCommentRequest.builder()
                .content("a".repeat(2001))
                .build();
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreateCommentRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Nội dung bình luận không được vượt quá 2000 ký tự");
    }
}
