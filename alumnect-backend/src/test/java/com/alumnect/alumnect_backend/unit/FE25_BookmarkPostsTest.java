package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.PostLikeRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.post.PostSaveRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.dto.response.post.SavePostResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostSave;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-25 Bookmark Posts (Save / View Saved).
 * Report sheet : FE-25 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.savePost(), unsavePost(), getSavedPosts()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-25 Bookmark Posts (Save / View Saved)")
class FE25_BookmarkPostsTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private PostRepository postRepository;

    @Mock
    private PostSaveRepository postSaveRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PostMapper postMapper;

    // ===== System under test =====
    @InjectMocks
    private PostServiceImpl postService;

    // ===== Test data =====
    private static final Long POST_ID = 5L;
    private static final Long SECOND_POST_ID = 6L;
    private static final Long MEMBER_ID = 1L;
    private static final Long AUTHOR_ID = 2L;
    private static final String MEMBER_EMAIL = "student@fpt.edu.vn";

    private User member;
    private User author;
    private Post post5;
    private Post post6;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();

        member = User.builder()
                .id(MEMBER_ID)
                .email(MEMBER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        author = User.builder()
                .id(AUTHOR_ID)
                .email("author@fpt.edu.vn")
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        post5 = Post.builder()
                .id(POST_ID)
                .author(author)
                .category(PostCategory.GENERAL)
                .content("Active post 5")
                .status(PostStatus.ACTIVE)
                .build();

        post6 = Post.builder()
                .id(SECOND_POST_ID)
                .author(author)
                .category(PostCategory.GENERAL)
                .content("Active post 6")
                .status(PostStatus.ACTIVE)
                .build();
    }

    // ================= savePost() =================

    @Test
    @DisplayName("UTCID01 - Member has not saved post 5 -> SavePostResponse(saved = true) and PostSave created")
    void utcid01_savePost_ok() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(post5));
        when(postSaveRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(false);

        // When
        SavePostResponse response = postService.savePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isSaved()).isTrue();

        ArgumentCaptor<PostSave> captor = ArgumentCaptor.forClass(PostSave.class);
        verify(postSaveRepository).save(captor.capture());
        assertThat(captor.getValue().getPost()).isEqualTo(post5);
        assertThat(captor.getValue().getUser()).isEqualTo(member);
    }

    @Test
    @DisplayName("UTCID02 - Member already saved post 5 -> Idempotent SavePostResponse(saved = true), no duplicate")
    void utcid02_savePost_okAlreadySaved() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(post5));
        when(postSaveRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(true);

        // When
        SavePostResponse response = postService.savePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isSaved()).isTrue();
        verify(postSaveRepository, never()).save(any());
    }

    // ================= unsavePost() =================

    @Test
    @DisplayName("UTCID03 - Member saved post 5 -> SavePostResponse(saved = false) and bookmark removed")
    void utcid03_unsavePost_ok() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(post5));
        when(postSaveRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(true);

        // When
        SavePostResponse response = postService.unsavePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isSaved()).isFalse();
        verify(postSaveRepository).deleteByPostIdAndUserId(POST_ID, MEMBER_ID);
    }

    // ================= getSavedPosts() =================

    @Test
    @DisplayName("UTCID04 - Member has 2 saved ACTIVE posts -> PageResponse with 2 PostResponse (saved = true)")
    void utcid04_getSavedPosts_ok() {
        // Given
        PostSave ps1 = PostSave.builder().id(1L).post(post5).user(member).build();
        PostSave ps2 = PostSave.builder().id(2L).post(post6).user(member).build();
        Page<PostSave> savedPage = new PageImpl<>(List.of(ps1, ps2), PageRequest.of(0, 10), 2);

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postSaveRepository.findActiveSavedPostsByUserId(MEMBER_ID, PageRequest.of(0, 10)))
                .thenReturn(savedPage);
        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(postLikeRepository.findLikedPostIds(eq(MEMBER_ID), any())).thenReturn(Collections.emptyList());
        when(postMapper.toResponse(eq(post5), any(), eq(false), eq(true), any(), any(), eq(false)))
                .thenReturn(PostResponse.builder().id("5").saved(true).build());
        when(postMapper.toResponse(eq(post6), any(), eq(false), eq(true), any(), any(), eq(false)))
                .thenReturn(PostResponse.builder().id("6").saved(true).build());

        // When
        PageResponse<PostResponse> response = postService.getSavedPosts(MEMBER_EMAIL, 0, 10);

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getContent()).extracting(PostResponse::isSaved).containsOnly(true);
        assertThat(response.getTotalElements()).isEqualTo(2);
        verify(postMapper).toResponse(eq(post5), any(), eq(false), eq(true), any(), any(), eq(false));
        verify(postMapper).toResponse(eq(post6), any(), eq(false), eq(true), any(), any(), eq(false));
    }

    @Test
    @DisplayName("UTCID05 - page = -1 -> BadRequestException")
    void utcid05_getSavedPosts_badRequestPage() {
        // Given
        int invalidPage = -1;

        // When + Then
        assertThatThrownBy(() -> postService.getSavedPosts(MEMBER_EMAIL, invalidPage, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
        verify(postSaveRepository, never()).findActiveSavedPostsByUserId(anyLong(), any());
    }
}
