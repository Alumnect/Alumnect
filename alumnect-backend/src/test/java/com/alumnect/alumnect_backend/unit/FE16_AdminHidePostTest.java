package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminPostMapper;
import com.alumnect.alumnect_backend.service.admin.AdminPostServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-16_Hide / Unhide Violating Posts.
 * Report sheet : FE-16 (Report5_Unit_Test.xlsx)
 * Functions    : AdminPostServiceImpl.togglePostHidden()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-16 Hide / Unhide Violating Posts")
class FE16_AdminHidePostTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private AdminPostMapper adminPostMapper;

    @Mock
    private JobPostingRepository jobPostingRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminPostServiceImpl adminPostService;

    @Test
    @DisplayName("UTCID01 - ACTIVE post -> isHidden=true sets status HIDDEN, saves and sends notification")
    void utcid01_togglePostHidden_hideActivePost() {
        // Given
        Post post = Post.builder().id(1L).status(PostStatus.ACTIVE).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        // When
        adminPostService.togglePostHidden(1L, true);

        // Then
        assertThat(post.getStatus()).isEqualTo(PostStatus.HIDDEN);
        verify(postRepository).save(post);
        verify(notificationService).sendReportResolvedNotification(post);
    }

    @Test
    @DisplayName("UTCID02 - HIDDEN post -> isHidden=false sets status ACTIVE, saves without notification")
    void utcid02_togglePostHidden_unhidePost() {
        // Given
        Post post = Post.builder().id(1L).status(PostStatus.HIDDEN).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        // When
        adminPostService.togglePostHidden(1L, false);

        // Then
        assertThat(post.getStatus()).isEqualTo(PostStatus.ACTIVE);
        verify(postRepository).save(post);
        verify(notificationService, never()).sendReportResolvedNotification(any());
    }

    @Test
    @DisplayName("UTCID03 - DELETED post -> BadRequestException cannot hide or unhide deleted post")
    void utcid03_togglePostHidden_deletedPostThrowsBadRequest() {
        // Given
        Post post = Post.builder().id(1L).status(PostStatus.DELETED).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        // When + Then
        assertThatThrownBy(() -> adminPostService.togglePostHidden(1L, true))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bài viết này đã bị xóa khỏi hệ thống, không thể thực hiện thao tác ẩn hoặc mở ẩn.");
    }

    @Test
    @DisplayName("UTCID04 - No post with id 404 -> ResourceNotFoundException")
    void utcid04_togglePostHidden_notFound() {
        // Given
        when(postRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> adminPostService.togglePostHidden(404L, true))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy bài viết với ID: 404");
    }
}
