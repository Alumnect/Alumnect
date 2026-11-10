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
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-67 Job Board (Recruitment Feed).
 * Report sheet : FE-67 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.getFeed() with type = recruitment
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FE-67 Job Board (Recruitment Feed)")
class FE67_JobBoardFeedTest {

    @Mock private PostRepository postRepository;
    @Mock private FollowRepository followRepository;
    @Mock private EventRepository eventRepository;
    @Mock private EventRegistrationRepository eventRegistrationRepository;
    @Mock private JobPostingRepository jobPostingRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private UserRepository userRepository;
    @Mock private PostMapper postMapper;
    @Mock private PostLikeRepository postLikeRepository;
    @Mock private PostSaveRepository postSaveRepository;

    @InjectMocks
    private PostServiceImpl postService;

    private static final String VIEWER_EMAIL = "viewer@fpt.edu.vn";

    private User author;
    private User viewer;
    private final Map<Long, boolean[]> flagsByPostId = new HashMap<>();

    @BeforeEach
    void setUp() {
        Role role = Role.builder().name("ALUMNI").build();
        author = User.builder().id(1L).email("hr@fpt.edu.vn").role(role).accountStatus(AccountStatus.ACTIVE).build();
        viewer = User.builder().id(99L).email(VIEWER_EMAIL)
                .role(Role.builder().name("STUDENT").build()).accountStatus(AccountStatus.ACTIVE).build();

        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(postMapper.toResponse(any(Post.class), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenAnswer(inv -> {
                    Post p = inv.getArgument(0);
                    flagsByPostId.put(p.getId(), new boolean[]{inv.getArgument(2), inv.getArgument(3)});
                    return PostResponse.builder().id(String.valueOf(p.getId())).build();
                });
    }

    private List<Post> recruitmentPosts(int count) {
        List<Post> posts = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            posts.add(Post.builder().id((long) i).author(author).category(PostCategory.RECRUITMENT)
                    .status(PostStatus.ACTIVE).createdAt(Instant.now().minusSeconds(i * 60L))
                    .likeCount(0).commentCount(0).repostCount(0).build());
        }
        return posts;
    }

    @Test
    @DisplayName("UTCID01 - Guest, 25 recruitment posts -> category RECRUITMENT, 3 pages, liked/saved false")
    void utcid01_getFeed_guest() {
        // Given
        when(postRepository.countActiveFeed(eq(PostCategory.RECRUITMENT), eq(""), eq(""))).thenReturn(25L);
        when(postRepository.findCandidatesForSmartFeed(eq(PostCategory.RECRUITMENT), eq(""), eq(""), any()))
                .thenReturn(recruitmentPosts(25));

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "recruitment", null, false, null);

        // Then
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.getTotalPages()).isEqualTo(3);
        assertThat(result.isLast()).isFalse();
        assertThat(result.getContent()).hasSize(10);
        assertThat(flagsByPostId.values()).allSatisfy(f -> {
            assertThat(f[0]).isFalse();
            assertThat(f[1]).isFalse();
        });
        verify(postRepository).countActiveFeed(PostCategory.RECRUITMENT, "", "");
    }

    @Test
    @DisplayName("UTCID02 - Logged-in viewer saved post 5 -> only post 5 has saved = true")
    void utcid02_getFeed_savedFlag() {
        // Given
        List<Post> posts = recruitmentPosts(10);
        when(postRepository.countActiveFeed(eq(PostCategory.RECRUITMENT), eq(""), eq(""))).thenReturn(10L);
        when(postRepository.findCandidatesForSmartFeed(eq(PostCategory.RECRUITMENT), eq(""), eq(""), any())).thenReturn(posts);
        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(userProfileRepository.findById(99L)).thenReturn(Optional.empty());
        when(followRepository.findFollowingIdsByFollowerId(99L)).thenReturn(List.of());
        when(postLikeRepository.findLikedPostIds(eq(99L), anyList())).thenReturn(List.of());
        when(postSaveRepository.findSavedPostIds(eq(99L), anyList())).thenReturn(List.of(5L));

        // When
        postService.getFeed(0, 10, "recruitment", null, true, VIEWER_EMAIL);

        // Then
        assertThat(flagsByPostId.get(5L)[1]).isTrue();
        assertThat(flagsByPostId.entrySet().stream().filter(e -> e.getValue()[1]).count()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID03 - Type \"Recruitment\" and keyword \"Backend\" -> case-insensitive type, \"%backend%\" patterns")
    void utcid03_getFeed_caseInsensitiveTypeAndKeyword() {
        // Given
        when(postRepository.countActiveFeed(eq(PostCategory.RECRUITMENT), eq("%backend%"), eq("%backend%"))).thenReturn(3L);
        when(postRepository.findCandidatesForSmartFeed(eq(PostCategory.RECRUITMENT), eq("%backend%"), eq("%backend%"), any()))
                .thenReturn(recruitmentPosts(3));

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "Recruitment", "Backend", false, null);

        // Then
        assertThat(result.getContent()).hasSize(3);
        verify(postRepository).countActiveFeed(PostCategory.RECRUITMENT, "%backend%", "%backend%");
    }

    @Test
    @DisplayName("UTCID04 - Keyword matches nothing -> empty PageResponse, candidates not loaded")
    void utcid04_getFeed_noMatch() {
        // Given
        when(postRepository.countActiveFeed(eq(PostCategory.RECRUITMENT), eq("%zzzqqq%"), eq("%zzzqqq%"))).thenReturn(0L);

        // When
        PageResponse<PostResponse> result = postService.getFeed(0, 10, "recruitment", "zzzqqq", false, null);

        // Then
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
        assertThat(result.getTotalPages()).isEqualTo(0);
        assertThat(result.isLast()).isTrue();
        verify(postRepository, never()).findCandidatesForSmartFeed(any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID05 - Page 2 of 25 posts (size 10) -> last page with 5 posts, last = true")
    void utcid05_getFeed_lastPage() {
        // Given
        when(postRepository.countActiveFeed(eq(PostCategory.RECRUITMENT), eq(""), eq(""))).thenReturn(25L);
        when(postRepository.findCandidatesForSmartFeed(eq(PostCategory.RECRUITMENT), eq(""), eq(""), any()))
                .thenReturn(recruitmentPosts(25));

        // When
        PageResponse<PostResponse> result = postService.getFeed(2, 10, "recruitment", null, false, null);

        // Then
        assertThat(result.getContent()).hasSize(5);
        assertThat(result.isLast()).isTrue();
        assertThat(result.getTotalPages()).isEqualTo(3);
    }
}
