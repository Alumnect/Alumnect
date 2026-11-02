package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
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
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
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

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-21_View Feed & Post Detail.
 * Report sheet : FE-21 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.getFeed(), PostServiceImpl.getPostDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-21 View Feed & Post Detail")
class FE21_ViewFeedPostTest {

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
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostSaveRepository postSaveRepository;

    @InjectMocks
    private PostServiceImpl postService;

    private User user1;
    private User user2;
    private User viewerUser;

    @BeforeEach
    void setUp() {
        Role role = Role.builder().name("STUDENT").build();

        user1 = User.builder().id(1L).email("user1@fpt.edu.vn").role(role).accountStatus(AccountStatus.ACTIVE).build();
        user2 = User.builder().id(2L).email("user2@fpt.edu.vn").role(role).accountStatus(AccountStatus.ACTIVE).build();
        viewerUser = User.builder().id(99L).email("viewer@fpt.edu.vn").role(role).accountStatus(AccountStatus.ACTIVE).build();
    }

    // ================= getFeed validation =================

    @Test
    @DisplayName("UTCID01 - page = -1 -> BadRequestException non-negative page required")
    void utcid01_getFeed_negativePage() {
        // When + Then
        assertThatThrownBy(() -> postService.getFeed(-1, 10, "ALL", null, false, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
    }

    @Test
    @DisplayName("UTCID02 - size = 0 -> BadRequestException positive size required")
    void utcid02_getFeed_zeroSize() {
        // When + Then
        assertThatThrownBy(() -> postService.getFeed(0, 0, "ALL", null, false, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số size phải là số nguyên dương");
    }

    @Test
    @DisplayName("UTCID03 - No active post matches -> empty PageResponse")
    void utcid03_getFeed_emptyFeed() {
        // Given
        when(postRepository.countActiveFeed(eq(null), eq(""), eq(""))).thenReturn(0L);

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "ALL", null, false, null);

        // Then
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0L);
        assertThat(result.getTotalPages()).isEqualTo(0);
        assertThat(result.isLast()).isTrue();
    }

    @Test
    @DisplayName("UTCID04 - Two candidate posts with identical stats -> viewer follows author of post 2 (+100 affinity score)")
    void utcid04_getFeed_socialAffinityRanking() {
        // Given
        Instant now = Instant.now();
        Post p1 = Post.builder().id(1L).author(user1).category(PostCategory.GENERAL).status(PostStatus.ACTIVE)
                .createdAt(now).likeCount(0).commentCount(0).repostCount(0).build();
        Post p2 = Post.builder().id(2L).author(user2).category(PostCategory.GENERAL).status(PostStatus.ACTIVE)
                .createdAt(now).likeCount(0).commentCount(0).repostCount(0).build();

        when(postRepository.countActiveFeed(eq(null), eq(""), eq(""))).thenReturn(2L);
        when(postRepository.findCandidatesForSmartFeed(eq(null), eq(""), eq(""), any())).thenReturn(List.of(p1, p2));

        when(userRepository.findByEmail("viewer@fpt.edu.vn")).thenReturn(Optional.of(viewerUser));
        when(userProfileRepository.findById(99L)).thenReturn(Optional.empty());
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(List.of(2L));

        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());

        PostResponse resp1 = PostResponse.builder().id("1").build();
        PostResponse resp2 = PostResponse.builder().id("2").build();
        when(postMapper.toResponse(eq(p1), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp1);
        when(postMapper.toResponse(eq(p2), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp2);

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "ALL", null, true, "viewer@fpt.edu.vn");

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getId()).isEqualTo("2");
        assertThat(result.getContent().get(1).getId()).isEqualTo("1");
    }

    @Test
    @DisplayName("UTCID05 - Pinned post 1 (old) listed first regardless of score")
    void utcid05_getFeed_pinnedPostRankedFirst() {
        // Given
        Instant old = Instant.now().minusSeconds(86400 * 5);
        Instant recent = Instant.now();

        Post p1 = Post.builder().id(1L).author(user1).category(PostCategory.GENERAL).status(PostStatus.ACTIVE)
                .createdAt(old).isPinned(true).likeCount(0).commentCount(0).repostCount(0).build();
        Post p2 = Post.builder().id(2L).author(user2).category(PostCategory.GENERAL).status(PostStatus.ACTIVE)
                .createdAt(recent).isPinned(false).likeCount(100).commentCount(50).repostCount(20).build();

        when(postRepository.countActiveFeed(eq(null), eq(""), eq(""))).thenReturn(2L);
        when(postRepository.findCandidatesForSmartFeed(eq(null), eq(""), eq(""), any())).thenReturn(List.of(p2, p1));

        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());

        PostResponse resp1 = PostResponse.builder().id("1").build();
        PostResponse resp2 = PostResponse.builder().id("2").build();
        when(postMapper.toResponse(eq(p1), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp1);
        when(postMapper.toResponse(eq(p2), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp2);

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "ALL", null, false, null);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getId()).isEqualTo("1");
        assertThat(result.getContent().get(1).getId()).isEqualTo("2");
    }

    @Test
    @DisplayName("UTCID06 - 200 posts, page=15, size=10 (index 150) -> deep chronological feed queried")
    void utcid06_getFeed_deepChronologicalFeed() {
        // Given
        when(postRepository.countActiveFeed(eq(null), eq(""), eq(""))).thenReturn(200L);
        Post pDeep = Post.builder().id(999L).author(user1).category(PostCategory.GENERAL).build();
        Page<Post> deepPage = new PageImpl<>(List.of(pDeep), PageRequest.of(15, 10), 200);
        when(postRepository.findChronologicalFeed(eq(null), eq(""), eq(""), eq(PageRequest.of(15, 10))))
                .thenReturn(deepPage);

        PostResponse resp = PostResponse.builder().id("999").build();
        when(postMapper.toResponse(eq(pDeep), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp);

        // When
        PageResponse<PostResponse> result = postService.getFeed(15, 10, "ALL", null, false, null);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("999");
        verify(postRepository).findChronologicalFeed(eq(null), eq(""), eq(""), eq(PageRequest.of(15, 10)));
        verify(postRepository, never()).findCandidatesForSmartFeed(any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID07 - 200 posts, page=14, size=10 (index 140) -> smart feed window queried")
    void utcid07_getFeed_smartFeedWindow() {
        // Given
        when(postRepository.countActiveFeed(eq(null), eq(""), eq(""))).thenReturn(200L);
        when(postRepository.findCandidatesForSmartFeed(eq(null), eq(""), eq(""), eq(PageRequest.of(0, 150))))
                .thenReturn(Collections.emptyList());

        // When
        PageResponse<PostResponse> result = postService.getFeed(14, 10, "ALL", null, false, null);

        // Then
        assertThat(result.getContent()).isEmpty();
        verify(postRepository).findCandidatesForSmartFeed(eq(null), eq(""), eq(""), eq(PageRequest.of(0, 150)));
        verify(postRepository, never()).findChronologicalFeed(any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID08 - keyword '  Nguyễn Văn ' passed as accented and unaccented patterns")
    void utcid08_getFeed_accentedAndUnaccentedPatterns() {
        // Given
        when(postRepository.countActiveFeed(eq(null), eq("%nguyễn văn%"), eq("%nguyen van%"))).thenReturn(0L);

        // When
        postService.getFeed(0, 10, "ALL", "  Nguyễn Văn ", false, null);

        // Then
        verify(postRepository).countActiveFeed(eq(null), eq("%nguyễn văn%"), eq("%nguyen van%"));
    }

    @Test
    @DisplayName("UTCID09 - type=EVENT, eventFilter='upcoming' loads upcoming events and preserves order")
    void utcid09_getFeed_upcomingEventsFilter() {
        // Given
        Event event70 = Event.builder().id(70L).title("Job Fair").build();
        Page<Event> eventPage = new PageImpl<>(List.of(event70), PageRequest.of(0, 10), 1);
        when(eventRepository.findUpcomingEvents(any(Instant.class), eq(""), eq(PageRequest.of(0, 10))))
                .thenReturn(eventPage);

        Post post900 = Post.builder().id(900L).author(user1).eventId(70L).category(PostCategory.EVENT).build();
        when(postRepository.findActiveByEventIdIn(List.of(70L))).thenReturn(List.of(post900));

        PostResponse resp = PostResponse.builder().id("900").build();
        when(postMapper.toResponse(eq(post900), any(), anyBoolean(), anyBoolean(), any(), eq(event70), anyBoolean()))
                .thenReturn(resp);

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "EVENT", null, "upcoming", false, null);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("900");
    }

    @Test
    @DisplayName("UTCID10 - Invalid type 'FOO' -> BadRequestException")
    void utcid10_getFeed_invalidType() {
        // When + Then
        assertThatThrownBy(() -> postService.getFeed(0, 10, "FOO", null, false, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Loại bài viết không hợp lệ: FOO");
    }

    // ================= getPostDetail =================

    @Test
    @DisplayName("UTCID11 - ACTIVE post 5 exists, viewer liked and saved it -> response has liked=true, saved=true")
    void utcid11_getPostDetail_likedAndSaved() {
        // Given
        Post post5 = Post.builder().id(5L).author(user1).status(PostStatus.ACTIVE).build();
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());

        when(userRepository.findByEmail("viewer@fpt.edu.vn")).thenReturn(Optional.of(viewerUser));
        when(postLikeRepository.findLikedPostIds(99L, List.of(5L))).thenReturn(List.of(5L));
        when(postSaveRepository.findSavedPostIds(99L, List.of(5L))).thenReturn(List.of(5L));

        PostResponse expected = PostResponse.builder().id("5").liked(true).saved(true).build();
        when(postMapper.toResponse(post5, null, true, true, null, null, false)).thenReturn(expected);

        // When
        PostResponse result = postService.getPostDetail(5L, true, "viewer@fpt.edu.vn");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.isLiked()).isTrue();
        assertThat(result.isSaved()).isTrue();
    }

    @Test
    @DisplayName("UTCID12 - No post with id 404 -> ResourceNotFoundException")
    void utcid12_getPostDetail_notFound() {
        // Given
        when(postRepository.findDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> postService.getPostDetail(404L, false, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết này không còn khả dụng");
    }

    @Test
    @DisplayName("UTCID13 - Post 5 exists but status is HIDDEN -> ResourceNotFoundException")
    void utcid13_getPostDetail_hiddenPostUnavailable() {
        // Given
        Post post5 = Post.builder().id(5L).author(user1).status(PostStatus.HIDDEN).build();
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));

        // When + Then
        assertThatThrownBy(() -> postService.getPostDetail(5L, false, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết này không còn khả dụng");
    }
}
