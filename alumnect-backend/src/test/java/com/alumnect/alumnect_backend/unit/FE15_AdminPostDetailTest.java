package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminPostResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.job.JobPosting;
import com.alumnect.alumnect_backend.entity.post.Post;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-15_View Community Post Detail.
 * Report sheet : FE-15 (Report5_Unit_Test.xlsx)
 * Functions    : AdminPostServiceImpl.getPostDetail()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-15 View Community Post Detail")
class FE15_AdminPostDetailTest {

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
    @DisplayName("UTCID01 - Post exists linked to job 7 and event 9 -> AdminPostResponse with job and event")
    void utcid01_getPostDetail_withJobAndEvent() {
        // Given
        Post post = Post.builder().id(1L).jobId(7L).eventId(9L).build();
        when(postRepository.findDetailById(1L)).thenReturn(Optional.of(post));

        JobPosting job = JobPosting.builder().id(7L).title("Job").build();
        when(jobPostingRepository.findById(7L)).thenReturn(Optional.of(job));

        Event event = Event.builder().id(9L).title("Event").build();
        when(eventRepository.findById(9L)).thenReturn(Optional.of(event));

        AdminPostResponse expectedResponse = AdminPostResponse.builder().id(1L).build();
        when(adminPostMapper.toDto(post, job, event)).thenReturn(expectedResponse);

        // When
        AdminPostResponse result = adminPostService.getPostDetail(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(adminPostMapper).toDto(post, job, event);
    }

    @Test
    @DisplayName("UTCID02 - Post exists without job/event -> AdminPostResponse with job=null, event=null")
    void utcid02_getPostDetail_withoutJobAndEvent() {
        // Given
        Post post = Post.builder().id(1L).jobId(null).eventId(null).build();
        when(postRepository.findDetailById(1L)).thenReturn(Optional.of(post));

        AdminPostResponse expectedResponse = AdminPostResponse.builder().id(1L).build();
        when(adminPostMapper.toDto(post, null, null)).thenReturn(expectedResponse);

        // When
        AdminPostResponse result = adminPostService.getPostDetail(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(adminPostMapper).toDto(post, null, null);
    }

    @Test
    @DisplayName("UTCID03 - No post with id 404 -> ResourceNotFoundException")
    void utcid03_getPostDetail_notFound() {
        // Given
        when(postRepository.findDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> adminPostService.getPostDetail(404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy bài viết với ID: 404");
    }
}
