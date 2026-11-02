package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.post.PostLikeRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.post.PostSaveRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.EditPostRequest;
import com.alumnect.alumnect_backend.dto.request.post.EventDto;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostMedia;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-22_Edit a Post.
 * Report sheet : FE-22 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.editPost()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-22 Edit a Post")
class FE22_EditPostTest {

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository eventRegistrationRepository;

    @Mock
    private JobPostingRepository jobPostingRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostSaveRepository postSaveRepository;

    @Mock
    private PostMapper postMapper;

    @InjectMocks
    private PostServiceImpl postService;

    private User alumniUser;
    private User studentUser;
    private Post post5;

    @BeforeEach
    void setUp() {
        Role alumniRole = Role.builder().name("ALUMNI").build();
        Role studentRole = Role.builder().name("STUDENT").build();

        alumniUser = User.builder().id(2L).email("alumni@fpt.edu.vn").role(alumniRole).accountStatus(AccountStatus.ACTIVE).build();
        studentUser = User.builder().id(3L).email("student@fpt.edu.vn").role(studentRole).accountStatus(AccountStatus.ACTIVE).build();

        post5 = Post.builder()
                .id(5L)
                .author(alumniUser)
                .category(PostCategory.GENERAL)
                .status(PostStatus.ACTIVE)
                .content("Original content")
                .mediaList(new ArrayList<>())
                .build();

        lenient().when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("UTCID01 - Alumni edits own general post -> content trimmed and saved")
    void utcid01_editPost_successTrimmedContent() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        PostResponse expected = PostResponse.builder().id("5").text("Updated text").build();
        when(postMapper.toResponse(eq(post5), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(expected);

        EditPostRequest req = EditPostRequest.builder()
                .content("  Updated text  ")
                .category("GENERAL")
                .build();

        // When
        PostResponse result = postService.editPost("alumni@fpt.edu.vn", 5L, req);

        // Then
        assertThat(result).isNotNull();
        assertThat(post5.getContent()).isEqualTo("Updated text");
    }

    @Test
    @DisplayName("UTCID02 - Editor is different user -> ForbiddenException edit own post only")
    void utcid02_editPost_otherUserForbidden() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));

        EditPostRequest req = EditPostRequest.builder()
                .content("Malicious update")
                .build();

        // When + Then
        assertThatThrownBy(() -> postService.editPost("student@fpt.edu.vn", 5L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ được chỉnh sửa bài viết của chính mình");
    }

    @Test
    @DisplayName("UTCID03 - Post linked to CANCELLED event -> BadRequestException cannot edit cancelled event")
    void utcid03_editPost_cancelledEvent() {
        // Given
        post5.setEventId(70L);
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));

        Event cancelledEvent = Event.builder().id(70L).status("CANCELLED").build();
        when(eventRepository.findById(70L)).thenReturn(Optional.of(cancelledEvent));

        EditPostRequest req = EditPostRequest.builder().content("Text").build();

        // When + Then
        assertThatThrownBy(() -> postService.editPost("alumni@fpt.edu.vn", 5L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã bị hủy, không thể chỉnh sửa thông tin.");
    }

    @Test
    @DisplayName("UTCID04 - Event ended in the past -> BadRequestException cannot edit ended event")
    void utcid04_editPost_endedEvent() {
        // Given
        post5.setEventId(70L);
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));

        Instant past = Instant.now().minus(1, ChronoUnit.DAYS);
        Event endedEvent = Event.builder().id(70L).status("ACTIVE").endTime(past).build();
        when(eventRepository.findById(70L)).thenReturn(Optional.of(endedEvent));

        EditPostRequest req = EditPostRequest.builder().content("Text").build();

        // When + Then
        assertThatThrownBy(() -> postService.editPost("alumni@fpt.edu.vn", 5L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã kết thúc, không thể chỉnh sửa thông tin sự kiện.");
    }

    @Test
    @DisplayName("UTCID05 - Event has 10 attendees, new capacity = 9 -> BadRequestException capacity below attendee count")
    void utcid05_editPost_capacityBelowAttendeeCount() {
        // Given
        post5.setCategory(PostCategory.EVENT);
        post5.setEventId(70L);
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));

        Instant future = Instant.now().plus(2, ChronoUnit.DAYS);
        Event upcomingEvent = Event.builder().id(70L).status("ACTIVE").startTime(future).endTime(future.plus(2, ChronoUnit.HOURS)).attendeeCount(10).build();
        when(eventRepository.findById(70L)).thenReturn(Optional.of(upcomingEvent));

        EventDto eventDto = new EventDto();
        eventDto.setStartTime(future);
        eventDto.setEndTime(future.plus(2, ChronoUnit.HOURS));
        eventDto.setCapacity(9);

        EditPostRequest req = EditPostRequest.builder()
                .content("Text")
                .category("EVENT")
                .event(eventDto)
                .build();

        // When + Then
        assertThatThrownBy(() -> postService.editPost("alumni@fpt.edu.vn", 5L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("Sức chứa tối đa không thể nhỏ hơn số người đã đăng ký tham gia (10 người)");
    }

    @Test
    @DisplayName("UTCID06 - Event has 10 attendees, new capacity = 10 -> accepted, event capacity updated")
    void utcid06_editPost_capacityEqualToAttendeeCount() {
        // Given
        post5.setCategory(PostCategory.EVENT);
        post5.setEventId(70L);
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        Instant future = Instant.now().plus(2, ChronoUnit.DAYS);
        Event upcomingEvent = Event.builder().id(70L).status("ACTIVE").startTime(future).endTime(future.plus(2, ChronoUnit.HOURS)).attendeeCount(10).build();
        when(eventRepository.findById(70L)).thenReturn(Optional.of(upcomingEvent));

        EventDto eventDto = new EventDto();
        eventDto.setStartTime(future);
        eventDto.setEndTime(future.plus(2, ChronoUnit.HOURS));
        eventDto.setCapacity(10);

        EditPostRequest req = EditPostRequest.builder()
                .content("Text")
                .category("EVENT")
                .event(eventDto)
                .build();

        PostResponse resp = PostResponse.builder().id("5").build();
        when(postMapper.toResponse(eq(post5), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp);

        // When
        postService.editPost("alumni@fpt.edu.vn", 5L, req);

        // Then
        assertThat(upcomingEvent.getCapacity()).isEqualTo(10);
        verify(eventRepository).save(upcomingEvent);
    }

    @Test
    @DisplayName("UTCID07 - Category changed from EVENT to GENERAL -> category changed and event link cleared")
    void utcid07_editPost_changeCategoryFromEventToGeneralClearsEventLink() {
        // Given
        post5.setCategory(PostCategory.EVENT);
        post5.setEventId(70L);
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        Instant future = Instant.now().plus(2, ChronoUnit.DAYS);
        Event upcomingEvent = Event.builder().id(70L).status("ACTIVE").startTime(future).build();
        when(eventRepository.findById(70L)).thenReturn(Optional.of(upcomingEvent));

        EditPostRequest req = EditPostRequest.builder()
                .content("No longer an event")
                .category("GENERAL")
                .build();

        PostResponse resp = PostResponse.builder().id("5").build();
        when(postMapper.toResponse(eq(post5), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp);

        // When
        postService.editPost("alumni@fpt.edu.vn", 5L, req);

        // Then
        assertThat(post5.getCategory()).isEqualTo(PostCategory.GENERAL);
        assertThat(post5.getEventId()).isNull();
    }

    @Test
    @DisplayName("UTCID08 - mediaUrls replaces existing media with sortOrder 0 and 1")
    void utcid08_editPost_replaceMedia() {
        // Given
        PostMedia oldMedia = PostMedia.builder().url("old.png").sortOrder((short) 0).build();
        post5.addMedia(oldMedia);

        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(postRepository.findDetailById(5L)).thenReturn(Optional.of(post5));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        EditPostRequest req = EditPostRequest.builder()
                .content("New media")
                .mediaUrls(List.of("n1.png", "n2.png"))
                .build();

        PostResponse resp = PostResponse.builder().id("5").build();
        when(postMapper.toResponse(eq(post5), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean())).thenReturn(resp);

        // When
        postService.editPost("alumni@fpt.edu.vn", 5L, req);

        // Then
        List<PostMedia> mediaList = post5.getMediaList();
        assertThat(mediaList).hasSize(2);
        assertThat(mediaList.get(0).getUrl()).isEqualTo("n1.png");
        assertThat(mediaList.get(0).getSortOrder()).isEqualTo((short) 0);
        assertThat(mediaList.get(1).getUrl()).isEqualTo("n2.png");
        assertThat(mediaList.get(1).getSortOrder()).isEqualTo((short) 1);
    }
}
