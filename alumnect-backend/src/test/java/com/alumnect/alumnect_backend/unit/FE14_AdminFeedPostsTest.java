package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminPostResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.job.JobPosting;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.mapper.admin.AdminPostMapper;
import com.alumnect.alumnect_backend.service.admin.AdminPostServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
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
import org.springframework.data.jpa.domain.Specification;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-14_View & Filter Community Posts.
 * Report sheet : FE-14 (Report5_Unit_Test.xlsx)
 * Functions    : AdminPostServiceImpl.getPosts()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-14 View & Filter Community Posts")
class FE14_AdminFeedPostsTest {

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
    @DisplayName("UTCID01 - 2 posts match: post 1 has job, post 2 has event -> mapper receives matching JobPosting and Event")
    @SuppressWarnings("unchecked")
    void utcid01_getPosts_jobAndEventAttached() {
        // Given
        Post post1 = Post.builder().id(1L).jobId(7L).build();
        Post post2 = Post.builder().id(2L).eventId(9L).build();
        Page<Post> page = new PageImpl<>(List.of(post1, post2), PageRequest.of(0, 10), 2);
        when(postRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        JobPosting job = JobPosting.builder().id(7L).title("Backend Dev").build();
        when(jobPostingRepository.findAllById(List.of(7L))).thenReturn(List.of(job));

        Event event = Event.builder().id(9L).title("Alumni Meet").build();
        when(eventRepository.findAllById(List.of(9L))).thenReturn(List.of(event));

        AdminPostResponse res1 = AdminPostResponse.builder().id(1L).build();
        AdminPostResponse res2 = AdminPostResponse.builder().id(2L).build();
        when(adminPostMapper.toDto(post1, job, null)).thenReturn(res1);
        when(adminPostMapper.toDto(post2, null, event)).thenReturn(res2);

        // When
        PageResponse<AdminPostResponse> result = adminPostService.getPosts("fpt", "", "ACTIVE", "RECRUITMENT", 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(2);
        verify(adminPostMapper).toDto(post1, job, null);
        verify(adminPostMapper).toDto(post2, null, event);
    }

    @Test
    @DisplayName("UTCID02 - No post matches -> empty PageResponse, no job/event lookups")
    @SuppressWarnings("unchecked")
    void utcid02_getPosts_noMatchesSkipsLookups() {
        // Given
        Page<Post> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(postRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<AdminPostResponse> result = adminPostService.getPosts("zzz", "", "ACTIVE", "RECRUITMENT", 0, 10);

        // Then
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0L);
        verify(jobPostingRepository, never()).findAllById(anyList());
        verify(eventRepository, never()).findAllById(anyList());
    }

    @Test
    @DisplayName("UTCID03 - Two posts reference same job id 7 -> findAllById called once with de-duplicated id")
    @SuppressWarnings("unchecked")
    void utcid03_getPosts_deduplicatesJobIds() {
        // Given
        Post post1 = Post.builder().id(1L).jobId(7L).build();
        Post post2 = Post.builder().id(2L).jobId(7L).build();
        Page<Post> page = new PageImpl<>(List.of(post1, post2), PageRequest.of(0, 10), 2);
        when(postRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        JobPosting job = JobPosting.builder().id(7L).build();
        when(jobPostingRepository.findAllById(List.of(7L))).thenReturn(List.of(job));

        AdminPostResponse res1 = AdminPostResponse.builder().id(1L).build();
        AdminPostResponse res2 = AdminPostResponse.builder().id(2L).build();
        when(adminPostMapper.toDto(eq(post1), eq(job), any())).thenReturn(res1);
        when(adminPostMapper.toDto(eq(post2), eq(job), any())).thenReturn(res2);

        // When
        PageResponse<AdminPostResponse> result = adminPostService.getPosts(null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(2);
        verify(jobPostingRepository).findAllById(List.of(7L));
    }

    @Test
    @DisplayName("UTCID04 - Posts without job/event -> mapper called with null job & event; repositories not queried")
    @SuppressWarnings("unchecked")
    void utcid04_getPosts_noJobOrEventSkipsQueries() {
        // Given
        Post post1 = Post.builder().id(1L).jobId(null).eventId(null).build();
        Page<Post> page = new PageImpl<>(List.of(post1), PageRequest.of(0, 10), 1);
        when(postRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        AdminPostResponse res1 = AdminPostResponse.builder().id(1L).build();
        when(adminPostMapper.toDto(post1, null, null)).thenReturn(res1);

        // When
        PageResponse<AdminPostResponse> result = adminPostService.getPosts(null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        verify(adminPostMapper).toDto(post1, null, null);
        verify(jobPostingRepository, never()).findAllById(anyList());
        verify(eventRepository, never()).findAllById(anyList());
    }
}
