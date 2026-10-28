package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.CommentRepository;
import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.post.PostLikeRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.post.PostSaveRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.post.CommentMapper;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
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
 * FE-33 Manage Posts (Share, Delete & Search Posts).
 * Report sheet : FE-33 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.deletePost(), getFeed(), getUserPosts()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-33 Manage Posts (Share, Delete & Search Posts)")
class FE33_ManagePostsTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private PostRepository postRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository eventRegistrationRepository;

    @Mock
    private JobPostingRepository jobPostingRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostMapper postMapper;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private CommentMapper commentMapper;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostSaveRepository postSaveRepository;

    @Mock
    private NotificationService notificationService;

    // ===== System under test =====
    @InjectMocks
    private PostServiceImpl postService;

    // ===== Test data =====
    private static final String OWNER_EMAIL = "owner@example.com";
    private static final String OTHER_STUDENT_EMAIL = "student2@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final Long POST_ID = 5L;
    private static final Long OWNER_ID = 1L;
    private static final Long OTHER_ID = 2L;
    private static final Long EVENT_ID = 70L;

    private User owner;
    private User otherStudent;
    private User admin;
    private Post activePost;
    private UserProfile ownerProfile;

    @BeforeEach
    void setUp() {
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role adminRole = Role.builder().id(3L).name("ADMIN").build();

        owner = User.builder()
                .id(OWNER_ID)
                .email(OWNER_EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .role(alumniRole)
                .build();

        otherStudent = User.builder()
                .id(OTHER_ID)
                .email(OTHER_STUDENT_EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .role(studentRole)
                .build();

        admin = User.builder()
                .id(999L)
                .email(ADMIN_EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .role(adminRole)
                .build();

        activePost = Post.builder()
                .id(POST_ID)
                .author(owner)
                .status(PostStatus.ACTIVE)
                .category(PostCategory.GENERAL)
                .build();

        ownerProfile = UserProfile.builder()
                .userId(OWNER_ID)
                .fullName("Owner User")
                .user(owner)
                .build();
    }

    // ================= deletePost() =================

    @Test
    @DisplayName("UTCID01 - Alumni owns active post -> Post status set to DELETED and saved")
    void utcid01_deletePost_ok() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));

        // When
        postService.deletePost(OWNER_EMAIL, POST_ID);

        // Then
        assertThat(activePost.getStatus()).isEqualTo(PostStatus.DELETED);
        verify(postRepository).save(activePost);
        verify(eventRepository, never()).save(any());
        verify(eventRegistrationRepository, never()).cancelAllByEventId(any());
    }

    @Test
    @DisplayName("UTCID02 - Event post deleted -> Event cancelled, registrations cancelled, post deleted")
    void utcid02_deletePost_okEventPost() {
        // Given
        activePost.setEventId(EVENT_ID);
        activePost.setCategory(PostCategory.EVENT);
        Event event = Event.builder()
                .id(EVENT_ID)
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

        // When
        postService.deletePost(OWNER_EMAIL, POST_ID);

        // Then
        assertThat(activePost.getStatus()).isEqualTo(PostStatus.DELETED);
        assertThat(event.getStatus()).isEqualTo("CANCELLED");
        verify(eventRepository).save(event);
        verify(eventRegistrationRepository).cancelAllByEventId(EVENT_ID);
        verify(postRepository).save(activePost);
    }

    @Test
    @DisplayName("UTCID03 - Post belongs to another user -> ForbiddenException")
    void utcid03_deletePost_forbiddenNotOwner() {
        // Given
        when(userRepository.findByEmail(OTHER_STUDENT_EMAIL)).thenReturn(Optional.of(otherStudent));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));

        // When + Then
        assertThatThrownBy(() -> postService.deletePost(OTHER_STUDENT_EMAIL, POST_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ được xóa bài viết của chính mình");
        verify(postRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID04 - User is ADMIN -> ForbiddenException")
    void utcid04_deletePost_forbiddenAdmin() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> postService.deletePost(ADMIN_EMAIL, POST_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được xóa bài viết");
        verify(postRepository, never()).findDetailById(any());
        verify(postRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Post does not exist -> ResourceNotFoundException")
    void utcid05_deletePost_notFound() {
        // Given
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(postRepository.findDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> postService.deletePost(OWNER_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết này không còn khả dụng");
        verify(postRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - Post already DELETED -> ResourceNotFoundException")
    void utcid06_deletePost_notFoundAlreadyDeleted() {
        // Given
        activePost.setStatus(PostStatus.DELETED);
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));

        // When + Then
        assertThatThrownBy(() -> postService.deletePost(OWNER_EMAIL, POST_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết này không còn khả dụng");
        verify(postRepository, never()).save(any());
    }

    // ================= getFeed() =================

    @Test
    @DisplayName("UTCID07 - Null keyword -> Search patterns empty strings, no keyword filter")
    void utcid07_getFeed_okNullKeyword() {
        // Given
        when(postRepository.countActiveFeed(null, "", "")).thenReturn(0L);

        // When
        PageResponse<PostResponse> response = postService.getFeed(0, 10, null, null, false, null);

        // Then
        assertThat(response.getContent()).isEmpty();
        verify(postRepository).countActiveFeed(null, "", "");
    }

    @Test
    @DisplayName("UTCID08 - Blank keyword -> Treated like empty keyword")
    void utcid08_getFeed_okBlankKeyword() {
        // Given
        when(postRepository.countActiveFeed(null, "", "")).thenReturn(0L);

        // When
        PageResponse<PostResponse> response = postService.getFeed(0, 10, null, "   ", false, null);

        // Then
        assertThat(response.getContent()).isEmpty();
        verify(postRepository).countActiveFeed(null, "", "");
    }

    @Test
    @DisplayName("UTCID09 - Keyword Ha Noi and RECRUITMENT -> Searches accent and unaccented patterns")
    void utcid09_getFeed_okAccentAndCategory() {
        // Given
        when(postRepository.countActiveFeed(PostCategory.RECRUITMENT, "%hà nội%", "%ha noi%"))
                .thenReturn(0L);

        // When
        PageResponse<PostResponse> response = postService.getFeed(0, 10, "RECRUITMENT", "Hà Nội", false, null);

        // Then
        assertThat(response.getContent()).isEmpty();
        verify(postRepository).countActiveFeed(PostCategory.RECRUITMENT, "%hà nội%", "%ha noi%");
    }

    @Test
    @DisplayName("UTCID10 - No post matches keyword -> Empty PageResponse with totalElements 0 and last true")
    void utcid10_getFeed_okNoMatch() {
        // Given
        when(postRepository.countActiveFeed(null, "%zzz-no-match%", "%zzz-no-match%")).thenReturn(0L);

        // When
        PageResponse<PostResponse> response = postService.getFeed(0, 10, null, "zzz-no-match", false, null);

        // Then
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
        assertThat(response.isLast()).isTrue();
    }

    // ================= getUserPosts() =================

    @Test
    @DisplayName("UTCID11 - Category all and anonymous viewer -> Returns PageResponse with no like/save lookup")
    void utcid11_getUserPosts_okAllAnonymous() {
        // Given
        Page<Post> postPage = new PageImpl<>(List.of(activePost), PageRequest.of(0, 10), 1);
        when(postRepository.findByAuthorIdAndCategory(OWNER_ID, null, PageRequest.of(0, 10)))
                .thenReturn(postPage);
        when(userProfileRepository.findAllById(List.of(OWNER_ID))).thenReturn(List.of(ownerProfile));

        PostResponse postResponse = PostResponse.builder().id("5").build();
        when(postMapper.toResponse(eq(activePost), eq(ownerProfile), eq(false), eq(false), any(), any(), eq(false)))
                .thenReturn(postResponse);

        // When
        PageResponse<PostResponse> response = postService.getUserPosts(OWNER_ID, "all", 0, 10, null);

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo("5");
        verify(userRepository, never()).findByEmail(any());
        verify(postLikeRepository, never()).findLikedPostIds(any(), any());
        verify(postSaveRepository, never()).findSavedPostIds(any(), any());
    }

    @Test
    @DisplayName("UTCID12 - Case-insensitive category and logged-in viewer -> saved flag of post is true")
    void utcid12_getUserPosts_okCategoryAndSaved() {
        // Given
        activePost.setCategory(PostCategory.ACHIEVEMENT);
        Page<Post> postPage = new PageImpl<>(List.of(activePost), PageRequest.of(0, 10), 1);
        when(postRepository.findByAuthorIdAndCategory(OWNER_ID, PostCategory.ACHIEVEMENT, PageRequest.of(0, 10)))
                .thenReturn(postPage);
        when(userProfileRepository.findAllById(List.of(OWNER_ID))).thenReturn(List.of(ownerProfile));

        User viewer = User.builder().id(88L).email("viewer@example.com").build();
        when(userRepository.findByEmail("viewer@example.com")).thenReturn(Optional.of(viewer));
        when(postLikeRepository.findLikedPostIds(88L, List.of(POST_ID))).thenReturn(Collections.emptyList());
        when(postSaveRepository.findSavedPostIds(88L, List.of(POST_ID))).thenReturn(List.of(POST_ID));

        PostResponse postResponse = PostResponse.builder().id("5").saved(true).build();
        when(postMapper.toResponse(eq(activePost), eq(ownerProfile), eq(false), eq(true), any(), any(), eq(false)))
                .thenReturn(postResponse);

        // When
        PageResponse<PostResponse> response = postService.getUserPosts(
                OWNER_ID, "achievement", 0, 10, "viewer@example.com");

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).isSaved()).isTrue();
    }

    @Test
    @DisplayName("UTCID13 - Invalid category FOO -> BadRequestException")
    void utcid13_getUserPosts_badRequestInvalidCategory() {
        // Given

        // When + Then
        assertThatThrownBy(() -> postService.getUserPosts(OWNER_ID, "FOO", 0, 10, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Loại bài viết không hợp lệ: FOO");
    }

    @Test
    @DisplayName("UTCID14 - Page negative -> BadRequestException")
    void utcid14_getUserPosts_badRequestNegativePage() {
        // Given

        // When + Then
        assertThatThrownBy(() -> postService.getUserPosts(OWNER_ID, "all", -1, 10, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
    }

    @Test
    @DisplayName("UTCID15 - Size zero -> BadRequestException")
    void utcid15_getUserPosts_badRequestZeroSize() {
        // Given

        // When + Then
        assertThatThrownBy(() -> postService.getUserPosts(OWNER_ID, "all", 0, 0, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số size phải là số nguyên dương");
    }

    @Test
    @DisplayName("UTCID16 - User has no posts -> Returns empty PageResponse")
    void utcid16_getUserPosts_okNoPosts() {
        // Given
        when(postRepository.findByAuthorIdAndCategory(99L, null, PageRequest.of(0, 10)))
                .thenReturn(Page.empty(PageRequest.of(0, 10)));
        when(userProfileRepository.findAllById(Collections.emptyList())).thenReturn(Collections.emptyList());

        // When
        PageResponse<PostResponse> response = postService.getUserPosts(99L, "all", 0, 10, null);

        // Then
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
    }
}
