package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.event.EventAttendeeResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventRegistrationResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.event.EventRegistration;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
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
 * FE-26 Event Attendance & RSVP Management.
 * Report sheet : FE-26 (Report5_Unit_Test.xlsx)
 * Functions    : EventServiceImpl.rsvpEvent(), cancelRsvp(), getRsvpStatus(), getEventAttendees()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-26 Event Attendance & RSVP Management")
class FE26_EventAttendanceRsvpTest {

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
    private static final Long ALUMNI_ID = 2L;
    private static final Long ADMIN_ID = 3L;
    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String ALUMNI_EMAIL = "alumni@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";

    private User student;
    private User alumni;
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

        alumni = User.builder()
                .id(ALUMNI_ID)
                .email(ALUMNI_EMAIL)
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
                .organizer(alumni)
                .title("Tech Career Talk")
                .startTime(Instant.now().plus(Duration.ofDays(1)))
                .capacity(10)
                .attendeeCount(3)
                .status("ACTIVE")
                .build();
    }

    // ================= rsvpEvent() =================

    @Test
    @DisplayName("UTCID01 - STUDENT not registered for upcoming ACTIVE event -> EventRegistration saved REGISTERED and count = 4")
    void utcid01_rsvpEvent_okNew() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID)).thenReturn(Optional.empty());
        when(eventRepository.incrementAttendeeCountSafe(EVENT_ID)).thenReturn(1);

        // When
        EventRegistrationResponse response = eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isTrue();
        assertThat(response.getAttendeeCount()).isEqualTo(4);
        assertThat(response.getCapacity()).isEqualTo(10);
        assertThat(response.getMessage()).isEqualTo("Đăng ký tham gia sự kiện thành công!");

        ArgumentCaptor<EventRegistration> captor = ArgumentCaptor.forClass(EventRegistration.class);
        verify(eventRegistrationRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("REGISTERED");
        assertThat(captor.getValue().getEvent()).isEqualTo(upcomingEvent);
        assertThat(captor.getValue().getUser()).isEqualTo(student);
        verify(eventRepository).incrementAttendeeCountSafe(EVENT_ID);
    }

    @Test
    @DisplayName("UTCID02 - STUDENT previously CANCELLED registration -> Existing registration reused with status REGISTERED")
    void utcid02_rsvpEvent_okReRegister() {
        // Given
        EventRegistration cancelledReg = EventRegistration.builder()
                .id(50L)
                .event(upcomingEvent)
                .user(student)
                .status("CANCELLED")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(cancelledReg));
        when(eventRepository.incrementAttendeeCountSafe(EVENT_ID)).thenReturn(1);

        // When
        EventRegistrationResponse response = eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isTrue();
        assertThat(response.getAttendeeCount()).isEqualTo(4);

        ArgumentCaptor<EventRegistration> captor = ArgumentCaptor.forClass(EventRegistration.class);
        verify(eventRegistrationRepository).save(captor.capture());
        assertThat(captor.getValue()).isSameAs(cancelledReg);
        assertThat(captor.getValue().getId()).isEqualTo(50L);
        assertThat(captor.getValue().getStatus()).isEqualTo("REGISTERED");
    }

    @Test
    @DisplayName("UTCID03 - STUDENT already REGISTERED -> ConflictException")
    void utcid03_rsvpEvent_conflict() {
        // Given
        EventRegistration activeReg = EventRegistration.builder()
                .id(50L)
                .event(upcomingEvent)
                .user(student)
                .status("REGISTERED")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(activeReg));

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã đăng ký tham gia sự kiện này rồi.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).incrementAttendeeCountSafe(anyLong());
    }

    @Test
    @DisplayName("UTCID04 - Event status is CANCELLED -> BadRequestException")
    void utcid04_rsvpEvent_badRequestCancelled() {
        // Given
        upcomingEvent.setStatus("CANCELLED");
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện này đã bị hủy, không thể đăng ký.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).incrementAttendeeCountSafe(anyLong());
    }

    @Test
    @DisplayName("UTCID05 - Event started 1 second ago -> BadRequestException")
    void utcid05_rsvpEvent_badRequestStarted() {
        // Given
        upcomingEvent.setStartTime(Instant.now().minusSeconds(1));
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã bắt đầu, không thể đăng ký tham gia.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).incrementAttendeeCountSafe(anyLong());
    }

    @Test
    @DisplayName("UTCID06 - Capacity 10 and attendeeCount = 10 (full) -> BadRequestException")
    void utcid06_rsvpEvent_badRequestFull() {
        // Given
        upcomingEvent.setAttendeeCount(10);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã đủ số lượng người tham gia.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).incrementAttendeeCountSafe(anyLong());
    }

    @Test
    @DisplayName("UTCID07 - Capacity 10 and attendeeCount = 9 (one seat left) -> Registration accepted with attendeeCount = 10")
    void utcid07_rsvpEvent_okLastSeat() {
        // Given
        upcomingEvent.setAttendeeCount(9);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID)).thenReturn(Optional.empty());
        when(eventRepository.incrementAttendeeCountSafe(EVENT_ID)).thenReturn(1);

        // When
        EventRegistrationResponse response = eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isTrue();
        assertThat(response.getAttendeeCount()).isEqualTo(10);
        verify(eventRegistrationRepository).save(any(EventRegistration.class));
    }

    @Test
    @DisplayName("UTCID08 - Event capacity = null (unlimited) with 500 attendees -> Registration accepted with capacity null")
    void utcid08_rsvpEvent_okUnlimited() {
        // Given
        upcomingEvent.setCapacity(null);
        upcomingEvent.setAttendeeCount(500);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID)).thenReturn(Optional.empty());
        when(eventRepository.incrementAttendeeCountSafe(EVENT_ID)).thenReturn(1);

        // When
        EventRegistrationResponse response = eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isTrue();
        assertThat(response.getAttendeeCount()).isEqualTo(501);
        assertThat(response.getCapacity()).isNull();
        verify(eventRegistrationRepository).save(any(EventRegistration.class));
    }

    @Test
    @DisplayName("UTCID09 - Counter update affects 0 rows (concurrent last seat taken) -> BadRequestException")
    void utcid09_rsvpEvent_badRequestRaceFull() {
        // Given
        upcomingEvent.setAttendeeCount(9);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID)).thenReturn(Optional.empty());
        when(eventRepository.incrementAttendeeCountSafe(EVENT_ID)).thenReturn(0);

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã đủ số lượng người tham gia.");
    }

    @Test
    @DisplayName("UTCID10 - Account role is ADMIN -> ForbiddenException")
    void utcid10_rsvpEvent_forbidden() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(EVENT_ID, ADMIN_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được đăng ký tham gia sự kiện");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).incrementAttendeeCountSafe(anyLong());
    }

    @Test
    @DisplayName("UTCID11 - Event id 404 does not exist -> ResourceNotFoundException")
    void utcid11_rsvpEvent_notFound() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(MISSING_EVENT_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> eventService.rsvpEvent(MISSING_EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy sự kiện");
        verify(eventRegistrationRepository, never()).save(any());
    }

    // ================= cancelRsvp() =================

    @Test
    @DisplayName("UTCID12 - STUDENT is REGISTERED for upcoming event (3 attendees) -> Status CANCELLED and attendeeCount = 2")
    void utcid12_cancelRsvp_ok() {
        // Given
        EventRegistration activeReg = EventRegistration.builder()
                .id(50L)
                .event(upcomingEvent)
                .user(student)
                .status("REGISTERED")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(activeReg));

        // When
        EventRegistrationResponse response = eventService.cancelRsvp(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isFalse();
        assertThat(response.getAttendeeCount()).isEqualTo(2);
        assertThat(response.getMessage()).isEqualTo("Hủy đăng ký tham gia sự kiện thành công!");

        ArgumentCaptor<EventRegistration> captor = ArgumentCaptor.forClass(EventRegistration.class);
        verify(eventRegistrationRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("CANCELLED");
        verify(eventRepository).decrementAttendeeCount(EVENT_ID);
    }

    @Test
    @DisplayName("UTCID13 - Event is CANCELLED (cancelRsvp) -> BadRequestException")
    void utcid13_cancelRsvp_badRequestEventCancel() {
        // Given
        upcomingEvent.setStatus("CANCELLED");
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelRsvp(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện này đã bị hủy.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).decrementAttendeeCount(anyLong());
    }

    @Test
    @DisplayName("UTCID14 - Event started 1 second ago (cancelRsvp) -> BadRequestException")
    void utcid14_cancelRsvp_badRequestStarted() {
        // Given
        upcomingEvent.setStartTime(Instant.now().minusSeconds(1));
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelRsvp(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sự kiện đã bắt đầu hoặc đã kết thúc, không thể hủy đăng ký.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).decrementAttendeeCount(anyLong());
    }

    @Test
    @DisplayName("UTCID15 - STUDENT never registered -> BadRequestException")
    void utcid15_cancelRsvp_badRequestNotReg() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID))
                .thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> eventService.cancelRsvp(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn chưa đăng ký tham gia sự kiện này.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).decrementAttendeeCount(anyLong());
    }

    @Test
    @DisplayName("UTCID16 - Registration already CANCELLED -> BadRequestException")
    void utcid16_cancelRsvp_badRequestAlready() {
        // Given
        EventRegistration cancelledReg = EventRegistration.builder()
                .id(50L)
                .event(upcomingEvent)
                .user(student)
                .status("CANCELLED")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(cancelledReg));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelRsvp(EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn chưa đăng ký tham gia sự kiện này.");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).decrementAttendeeCount(anyLong());
    }

    @Test
    @DisplayName("UTCID17 - Registration REGISTERED but cached attendeeCount = 0 -> Returned attendeeCount stays 0")
    void utcid17_cancelRsvp_okCountZero() {
        // Given
        upcomingEvent.setAttendeeCount(0);
        EventRegistration activeReg = EventRegistration.builder()
                .id(50L)
                .event(upcomingEvent)
                .user(student)
                .status("REGISTERED")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(EVENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(activeReg));

        // When
        EventRegistrationResponse response = eventService.cancelRsvp(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isFalse();
        assertThat(response.getAttendeeCount()).isZero();
        verify(eventRegistrationRepository).save(activeReg);
        verify(eventRepository).decrementAttendeeCount(EVENT_ID);
    }

    @Test
    @DisplayName("UTCID18 - Account role is ADMIN (cancelRsvp) -> ForbiddenException")
    void utcid18_cancelRsvp_forbidden() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> eventService.cancelRsvp(EVENT_ID, ADMIN_EMAIL))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được hủy đăng ký tham gia sự kiện");
        verify(eventRegistrationRepository, never()).save(any());
        verify(eventRepository, never()).decrementAttendeeCount(anyLong());
    }

    // ================= getRsvpStatus() =================

    @Test
    @DisplayName("UTCID19 - STUDENT is REGISTERED for event 70 -> registered = true, attendeeCount = 3, capacity = 10")
    void utcid19_getRsvpStatus_okRegistered() {
        // Given
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(eventRegistrationRepository.existsByEventIdAndUserIdAndStatus(EVENT_ID, STUDENT_ID, "REGISTERED"))
                .thenReturn(true);

        // When
        EventRegistrationResponse response = eventService.getRsvpStatus(EVENT_ID, STUDENT_EMAIL);

        // Then
        assertThat(response.isRegistered()).isTrue();
        assertThat(response.getAttendeeCount()).isEqualTo(3);
        assertThat(response.getCapacity()).isEqualTo(10);
    }

    @Test
    @DisplayName("UTCID20 - Guest visitor (email = null) -> registered = false with counters and no user lookup")
    void utcid20_getRsvpStatus_okGuest() {
        // Given
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));

        // When
        EventRegistrationResponse response = eventService.getRsvpStatus(EVENT_ID, null);

        // Then
        assertThat(response.isRegistered()).isFalse();
        assertThat(response.getAttendeeCount()).isEqualTo(3);
        assertThat(response.getCapacity()).isEqualTo(10);
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("UTCID21 - Event id 404 does not exist (getRsvpStatus) -> ResourceNotFoundException")
    void utcid21_getRsvpStatus_notFound() {
        // Given
        when(eventRepository.findById(MISSING_EVENT_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> eventService.getRsvpStatus(MISSING_EVENT_ID, STUDENT_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy sự kiện");
    }

    // ================= getEventAttendees() =================

    @Test
    @DisplayName("UTCID22 - 2 REGISTERED attendees (alumni with headline, student with major) -> 2 responses, student headline falls back to major")
    void utcid22_getEventAttendees_ok() {
        // Given
        Instant t1 = Instant.now().minusSeconds(120);
        Instant t2 = Instant.now().minusSeconds(60);
        EventRegistration regAlumni = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(alumni).status("REGISTERED").createdAt(t1).build();
        EventRegistration regStudent = EventRegistration.builder()
                .id(2L).event(upcomingEvent).user(student).status("REGISTERED").createdAt(t2).build();

        UserProfile alumniProfile = UserProfile.builder()
                .userId(ALUMNI_ID)
                .fullName("Alumni User")
                .headline("Tech Lead @ FPT")
                .build();
        Major seMajor = Major.builder().id(1L).code("SE").name("Software Engineering").build();
        UserProfile studentProfile = UserProfile.builder()
                .userId(STUDENT_ID)
                .fullName("Student User")
                .headline("")
                .major(seMajor)
                .build();

        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(EVENT_ID, "REGISTERED"))
                .thenReturn(List.of(regAlumni, regStudent));
        when(userProfileRepository.findAllById(List.of(ALUMNI_ID, STUDENT_ID)))
                .thenReturn(List.of(alumniProfile, studentProfile));

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUserId()).isEqualTo(ALUMNI_ID);
        assertThat(result.get(0).getHeadline()).isEqualTo("Tech Lead @ FPT");
        assertThat(result.get(1).getUserId()).isEqualTo(STUDENT_ID);
        assertThat(result.get(1).getHeadline()).isEqualTo("Software Engineering");
    }

    @Test
    @DisplayName("UTCID23 - Role filter 'alumni' (case-insensitive) -> Only ALUMNI attendee returned")
    void utcid23_getEventAttendees_okRoleAlumni() {
        // Given
        EventRegistration regAlumni = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(alumni).status("REGISTERED").build();
        EventRegistration regStudent = EventRegistration.builder()
                .id(2L).event(upcomingEvent).user(student).status("REGISTERED").build();

        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(EVENT_ID, "REGISTERED"))
                .thenReturn(List.of(regAlumni, regStudent));
        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID, null, "alumni");

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRole()).isEqualTo("ALUMNI");
    }

    @Test
    @DisplayName("UTCID24 - Role filter 'ALL' -> Both ALUMNI and STUDENT attendees returned")
    void utcid24_getEventAttendees_okRoleAll() {
        // Given
        EventRegistration regAlumni = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(alumni).status("REGISTERED").build();
        EventRegistration regStudent = EventRegistration.builder()
                .id(2L).event(upcomingEvent).user(student).status("REGISTERED").build();

        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(EVENT_ID, "REGISTERED"))
                .thenReturn(List.of(regAlumni, regStudent));
        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID, null, "ALL");

        // Then
        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("UTCID25 - Search '  NGUYEN ' -> Case-insensitive trimmed search keeps only 'Nguyen Van A'")
    void utcid25_getEventAttendees_okSearch() {
        // Given
        EventRegistration reg1 = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();
        EventRegistration reg2 = EventRegistration.builder()
                .id(2L).event(upcomingEvent).user(alumni).status("REGISTERED").build();

        UserProfile profileA = UserProfile.builder().userId(STUDENT_ID).fullName("Nguyen Van A").build();
        UserProfile profileB = UserProfile.builder().userId(ALUMNI_ID).fullName("Tran Thi B").build();

        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(EVENT_ID, "REGISTERED"))
                .thenReturn(List.of(reg1, reg2));
        when(userProfileRepository.findAllById(List.of(STUDENT_ID, ALUMNI_ID)))
                .thenReturn(List.of(profileA, profileB));

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID, "  NGUYEN ", null);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFullName()).isEqualTo("Nguyen Van A");
    }

    @Test
    @DisplayName("UTCID26 - Attendee has no profile row -> fullName falls back to email and headline is empty")
    void utcid26_getEventAttendees_okNoProfile() {
        // Given
        EventRegistration reg = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();

        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(EVENT_ID, "REGISTERED"))
                .thenReturn(List.of(reg));
        when(userProfileRepository.findAllById(List.of(STUDENT_ID))).thenReturn(Collections.emptyList());

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFullName()).isEqualTo(STUDENT_EMAIL);
        assertThat(result.get(0).getHeadline()).isEmpty();
    }

    @Test
    @DisplayName("UTCID27 - Event is CANCELLED with REGISTERED and CANCELLED registrations -> All registrations listed")
    void utcid27_getEventAttendees_okCancelled() {
        // Given
        upcomingEvent.setStatus("CANCELLED");
        EventRegistration reg1 = EventRegistration.builder()
                .id(1L).event(upcomingEvent).user(student).status("REGISTERED").build();
        EventRegistration reg2 = EventRegistration.builder()
                .id(2L).event(upcomingEvent).user(alumni).status("CANCELLED").build();

        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdOrderByCreatedAtAsc(EVENT_ID))
                .thenReturn(List.of(reg1, reg2));
        when(userProfileRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID);

        // Then
        assertThat(result).hasSize(2);
        verify(eventRegistrationRepository).findByEventIdOrderByCreatedAtAsc(EVENT_ID);
    }

    @Test
    @DisplayName("UTCID28 - Event has no registration -> Empty list without querying profiles")
    void utcid28_getEventAttendees_okEmpty() {
        // Given
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(upcomingEvent));
        when(eventRegistrationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(EVENT_ID, "REGISTERED"))
                .thenReturn(Collections.emptyList());

        // When
        List<EventAttendeeResponse> result = eventService.getEventAttendees(EVENT_ID);

        // Then
        assertThat(result).isEmpty();
        verify(userProfileRepository, never()).findAllById(any());
    }

    @Test
    @DisplayName("UTCID29 - Event id 404 does not exist (getEventAttendees) -> ResourceNotFoundException")
    void utcid29_getEventAttendees_notFound() {
        // Given
        when(eventRepository.findById(MISSING_EVENT_ID)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> eventService.getEventAttendees(MISSING_EVENT_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy sự kiện");
        verify(userProfileRepository, never()).findAllById(any());
    }
}
