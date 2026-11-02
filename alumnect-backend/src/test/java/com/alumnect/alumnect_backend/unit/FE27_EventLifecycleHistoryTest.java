package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.event.EventCancelResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventHistoryResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.event.EventRegistration;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostMedia;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.event.EventServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-27 Event Lifecycle & Attendance History.
 * Report sheet : FE-27 (Report5_Unit_Test.xlsx)
 * Functions    : EventServiceImpl.cancelEvent(), getEventHistory()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-27 Event Lifecycle & Attendance History")
class FE27_EventLifecycleHistoryTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository eventRegistrationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PostRepository postRepository;

    // ===== System under test =====
    private EventServiceImpl eventService;

    // ===== Test data =====
    private static final Long EVENT_ID = 70L;
    private static final Long MISSING_EVENT_ID = 404L;
    private static final Long STUDENT_ID = 1L;
    private static final Long ORGANIZER_ID = 2L;
    private static final Long OTHER_ALUMNI_ID = 3L;
    private static final Long ADMIN_ID = 4L;

    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String ORGANIZER_EMAIL = "organizer@fpt.edu.vn";
    private static final String OTHER_ALUMNI_EMAIL = "other.alumni@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final String GHOST_EMAIL = "ghost@fpt.edu.vn";

    private User student;
    private User organizer;
    private User otherAlumni;
    private User admin;
    private Event upcomingEvent;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(
                eventRepository,
                eventRegistrationRepository,
                userRepository,
                userProfileRepository,
                postRepository
        );

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        Role adminRole = Role.builder().id(3L).name("ADMIN").build();

        student = User.builder()
                .id(STUDENT_ID)
                .email(STUDENT_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        organizer = User.builder()
                .id(ORGANIZER_ID)
                .email(ORGANIZER_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        otherAlumni = User.builder()
                .id(OTHER_ALUMNI_ID)
                .email(OTHER_ALUMNI_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        admin = User.builder()
                .id(ADMIN_ID)
                .email(ADMIN_EMAIL)
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        upcomingEvent = Event.builder()
                .id(EVENT_ID)
                .organizer(organizer)
                .title("FPT Alumni Meetup")
                .location("Hall A")
                .startTime(Instant.now().plus(Duration.ofDays(2)))
                .endTime(Instant.now().plus(Duration.ofDays(2).plusHours(2)))
                .capacity(50)
                .attendeeCount(5)
                .status("ACTIVE")
                .build();
    }

    // ================= cancelEvent() =================

    @Test
    @DisplayName("UTCID01 - ALUMNI organiser cancels upcoming ACTIVE event 70 -> Event CANCELLED and all registrations cancelled")
    void utcid01_cancelEvent_okOrganizer() {
        // Given
        when(userRepository.findByEmail(ORGANIZER_EMAIL)).thenReturn(Optional.of(organizer));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When
        EventCancelResponse response = eventService.cancelEvent(EVENT_ID, ORGANIZER_EMAIL);

        // Then
        assertThat(response.getEventId()).isEqualTo(EVENT_ID);
        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(response.getMessage()).isEqualTo("Hủy sự kiện thành công!");

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("CANCELLED");
        verify(eventRegistrationRepository).cancelAllByEventId(EVENT_ID);
    }

    @Test
    @DisplayName("UTCID02 - Logged-in ADMIN (not organiser) cancels event 70 -> Event status = CANCELLED")
    void utcid02_cancelEvent_okAdmin() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When
        EventCancelResponse response = eventService.cancelEvent(EVENT_ID, ADMIN_EMAIL);

        // Then
        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        verify(eventRepository).save(upcomingEvent);
        verify(eventRegistrationRepository).cancelAllByEventId(EVENT_ID);
    }

    @Test
    @DisplayName("UTCID03 - Logged-in user is STUDENT -> ForbiddenException")
    void utcid03_cancelEvent_forbiddenStudent() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelEvent(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ cựu sinh viên (người tổ chức) mới có quyền hủy sự kiện.");
        verify(eventRepository, never()).save(any());
        verify(eventRegistrationRepository, never()).cancelAllByEventId(anyLong());
    }

    @Test
    @DisplayName("UTCID04 - Another ALUMNI (not organiser) tries to cancel event 70 -> ForbiddenException")
    void utcid04_cancelEvent_forbiddenNotOwner() {
        // Given
        when(userRepository.findByEmail(OTHER_ALUMNI_EMAIL)).thenReturn(Optional.of(otherAlumni));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelEvent(EVENT_ID, OTHER_ALUMNI_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền hủy sự kiện này vì không phải là người tổ chức.");
        verify(eventRepository, never()).save(any());
        verify(eventRegistrationRepository, never()).cancelAllByEventId(anyLong());
    }

    @Test
    @DisplayName("UTCID05 - Event 70 is already CANCELLED -> BadRequestException")
    void utcid05_cancelEvent_badRequestAlready() {
        // Given
        upcomingEvent.setStatus("CANCELLED");
        when(userRepository.findByEmail(ORGANIZER_EMAIL)).thenReturn(Optional.of(organizer));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelEvent(EVENT_ID, ORGANIZER_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện này đã bị hủy trước đó.");
        verify(eventRepository, never()).save(any());
        verify(eventRegistrationRepository, never()).cancelAllByEventId(anyLong());
    }

    @Test
    @DisplayName("UTCID06 - Event started 1 second ago -> BadRequestException")
    void utcid06_cancelEvent_badRequestStarted() {
        // Given
        upcomingEvent.setStartTime(Instant.now().minusSeconds(1));
        when(userRepository.findByEmail(ORGANIZER_EMAIL)).thenReturn(Optional.of(organizer));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelEvent(EVENT_ID, ORGANIZER_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã kết thúc hoặc đang diễn ra, không thể hủy.");
        verify(eventRepository, never()).save(any());
        verify(eventRegistrationRepository, never()).cancelAllByEventId(anyLong());
    }

    @Test
    @DisplayName("UTCID07 - Event id 404 does not exist -> ResourceNotFoundException")
    void utcid07_cancelEvent_notFoundEvent() {
        // Given
        when(userRepository.findByEmail(ORGANIZER_EMAIL)).thenReturn(Optional.of(organizer));
        when(eventRepository.findById(MISSING_EVENT_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> eventService.cancelEvent(MISSING_EVENT_ID, ORGANIZER_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy sự kiện");
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID08 - No account for email ghost@fpt.edu.vn -> ResourceNotFoundException")
    void utcid08_cancelEvent_notFoundUser() {
        // Given
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> eventService.cancelEvent(EVENT_ID, GHOST_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng");
        verify(eventRepository, never()).save(any());
    }

    // ================= getEventHistory() =================

    @Test
    @DisplayName("UTCID09 - Registered event starts in 2 days -> attendanceState = UPCOMING")
    void utcid09_getEventHistory_okUpcoming() {
        // Given
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();
        Page<EventRegistration> page = new PageImpl<>(List.of(reg), PageRequest.of(0, 10), 1);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(page);
        when(postRepository.findActiveByEventIdIn(List.of(EVENT_ID))).thenReturn(Collections.emptyList());
        when(userProfileRepository.findAllById(List.of(ORGANIZER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getAttendanceState()).isEqualTo("UPCOMING");
    }

    @Test
    @DisplayName("UTCID10 - Registered event ended yesterday -> attendanceState = PAST")
    void utcid10_getEventHistory_okPast() {
        // Given
        upcomingEvent.setStartTime(Instant.now().minus(Duration.ofDays(2)));
        upcomingEvent.setEndTime(Instant.now().minus(Duration.ofDays(1)));
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();
        Page<EventRegistration> page = new PageImpl<>(List.of(reg), PageRequest.of(0, 10), 1);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(page);
        when(postRepository.findActiveByEventIdIn(List.of(EVENT_ID))).thenReturn(Collections.emptyList());
        when(userProfileRepository.findAllById(List.of(ORGANIZER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getAttendanceState()).isEqualTo("PAST");
    }

    @Test
    @DisplayName("UTCID11 - Registered event started 1 hour ago and ends in 1 hour -> attendanceState = ONGOING")
    void utcid11_getEventHistory_okOngoing() {
        // Given
        upcomingEvent.setStartTime(Instant.now().minus(Duration.ofHours(1)));
        upcomingEvent.setEndTime(Instant.now().plus(Duration.ofHours(1)));
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();
        Page<EventRegistration> page = new PageImpl<>(List.of(reg), PageRequest.of(0, 10), 1);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(page);
        when(postRepository.findActiveByEventIdIn(List.of(EVENT_ID))).thenReturn(Collections.emptyList());
        when(userProfileRepository.findAllById(List.of(ORGANIZER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getAttendanceState()).isEqualTo("ONGOING");
    }

    @Test
    @DisplayName("UTCID12 - Event itself is CANCELLED -> attendanceState = EVENT_CANCELLED")
    void utcid12_getEventHistory_okEventCancelled() {
        // Given
        upcomingEvent.setStatus("CANCELLED");
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("CANCELLED").build();
        Page<EventRegistration> page = new PageImpl<>(List.of(reg), PageRequest.of(0, 10), 1);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(page);
        when(postRepository.findActiveByEventIdIn(List.of(EVENT_ID))).thenReturn(Collections.emptyList());
        when(userProfileRepository.findAllById(List.of(ORGANIZER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getAttendanceState()).isEqualTo("EVENT_CANCELLED");
    }

    @Test
    @DisplayName("UTCID13 - Event ACTIVE but member cancelled registration -> attendanceState = REGISTRATION_CANCELLED")
    void utcid13_getEventHistory_okRegCancelled() {
        // Given
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("CANCELLED").build();
        Page<EventRegistration> page = new PageImpl<>(List.of(reg), PageRequest.of(0, 10), 1);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(page);
        when(postRepository.findActiveByEventIdIn(List.of(EVENT_ID))).thenReturn(Collections.emptyList());
        when(userProfileRepository.findAllById(List.of(ORGANIZER_ID))).thenReturn(Collections.emptyList());

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getAttendanceState()).isEqualTo("REGISTRATION_CANCELLED");
    }

    @Test
    @DisplayName("UTCID14 - Member never joined any event -> Empty PageResponse and lookups skipped")
    void utcid14_getEventHistory_okEmpty() {
        // Given
        Page<EventRegistration> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(emptyPage);

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).isEmpty();
        assertThat(response.isLast()).isTrue();
        verify(postRepository, never()).findActiveByEventIdIn(any());
        verify(userProfileRepository, never()).findAllById(any());
    }

    @Test
    @DisplayName("UTCID15 - size = 51 (above maximum of 50) -> Page size falls back to default 10")
    void utcid15_getEventHistory_okSizeFallback() {
        // Given
        Page<EventRegistration> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(emptyPage);

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 51, "all");

        // Then
        assertThat(response.getPageSize()).isEqualTo(10);
        verify(eventRegistrationRepository).findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10));
    }

    @Test
    @DisplayName("UTCID16 - size = 50 (maximum accepted) -> Page size is kept at 50")
    void utcid16_getEventHistory_okSizeMax() {
        // Given
        Page<EventRegistration> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 50), 0);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 50)))
                .thenReturn(emptyPage);

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 50, "all");

        // Then
        assertThat(response.getPageSize()).isEqualTo(50);
        verify(eventRegistrationRepository).findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 50));
    }

    @Test
    @DisplayName("UTCID17 - page = -3 -> Negative page index clamped to 0")
    void utcid17_getEventHistory_okNegativePage() {
        // Given
        Page<EventRegistration> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(emptyPage);

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, -3, 10, "all");

        // Then
        assertThat(response.getPageNumber()).isZero();
        verify(eventRegistrationRepository).findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10));
    }

    @Test
    @DisplayName("UTCID18 - filter = 'banana' (unsupported) -> Filter normalised to 'all'")
    void utcid18_getEventHistory_okInvalidFilter() {
        // Given
        Page<EventRegistration> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(emptyPage);

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "banana");

        // Then
        assertThat(response.getContent()).isEmpty();
        verify(eventRegistrationRepository).findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10));
    }

    @Test
    @DisplayName("UTCID19 - filter = '  PAST ' -> Filter normalised to 'past'")
    void utcid19_getEventHistory_okFilterTrimmed() {
        // Given
        Page<EventRegistration> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "past", PageRequest.of(0, 10)))
                .thenReturn(emptyPage);

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "  PAST ");

        // Then
        assertThat(response.getContent()).isEmpty();
        verify(eventRegistrationRepository).findUserEventHistory(STUDENT_ID, "past", PageRequest.of(0, 10));
    }

    @Test
    @DisplayName("UTCID20 - Event has ACTIVE post with 2 images -> EventHistoryResponse carries postId, first image coverUrl and organizer profile name")
    void utcid20_getEventHistory_okCoverImage() {
        // Given
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();
        Page<EventRegistration> page = new PageImpl<>(List.of(reg), PageRequest.of(0, 10), 1);

        PostMedia media1 = PostMedia.builder().id(1L).url("https://cdn.alumnect.com/img1.jpg").sortOrder((short) 0).build();
        PostMedia media2 = PostMedia.builder().id(2L).url("https://cdn.alumnect.com/img2.jpg").sortOrder((short) 1).build();
        Post eventPost = Post.builder()
                .id(500L)
                .author(organizer)
                .category(PostCategory.EVENT)
                .status(PostStatus.ACTIVE)
                .eventId(EVENT_ID)
                .build();
        eventPost.addMedia(media1);
        eventPost.addMedia(media2);

        UserProfile orgProfile = UserProfile.builder()
                .userId(ORGANIZER_ID)
                .fullName("Organizer Full Name")
                .avatarUrl("https://cdn.alumnect.com/avatar.jpg")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.findUserEventHistory(STUDENT_ID, "all", PageRequest.of(0, 10)))
                .thenReturn(page);
        when(postRepository.findActiveByEventIdIn(List.of(EVENT_ID))).thenReturn(List.of(eventPost));
        when(userProfileRepository.findAllById(List.of(ORGANIZER_ID))).thenReturn(List.of(orgProfile));

        // When
        PageResponse<EventHistoryResponse> response = eventService.getEventHistory(STUDENT_EMAIL, 0, 10, "all");

        // Then
        assertThat(response.getContent()).hasSize(1);
        EventHistoryResponse item = response.getContent().get(0);
        assertThat(item.getPostId()).isEqualTo(500L);
        assertThat(item.getCoverUrl()).isEqualTo("https://cdn.alumnect.com/img1.jpg");
        assertThat(item.getOrganizerName()).isEqualTo("Organizer Full Name");
    }

    @Test
    @DisplayName("UTCID21 - Account role is ADMIN (getEventHistory) -> ForbiddenException")
    void utcid21_getEventHistory_forbiddenAdmin() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> eventService.getEventHistory(ADMIN_EMAIL, 0, 10, "all"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới có lịch sử tham gia sự kiện");
        verify(eventRegistrationRepository, never()).findUserEventHistory(anyLong(), any(), any());
    }
}
