package com.alumnect.alumnect_backend.service.event;

import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.event.EventRegistrationResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.event.EventRegistration;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository eventRegistrationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private EventServiceImpl eventService;

    private User studentUser;
    private User adminUser;
    private Event futureEvent;

    @BeforeEach
    void setUp() {
        studentUser = User.builder()
                .id(10L)
                .email("student@fpt.edu.vn")
                .role(Role.builder().id(1L).name("STUDENT").build())
                .build();

        adminUser = User.builder()
                .id(99L)
                .email("admin@fpt.edu.vn")
                .role(Role.builder().id(3L).name("ADMIN").build())
                .build();

        futureEvent = Event.builder()
                .id(1L)
                .title("Hội thảo AI & Nghề nghiệp")
                .location("FPT University Da Nang")
                .startTime(Instant.now().plus(7, ChronoUnit.DAYS))
                .capacity(50)
                .attendeeCount(10)
                .build();
    }

    @Test
    void rsvpEvent_success() {
        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));
        when(eventRepository.findById(futureEvent.getId())).thenReturn(Optional.of(futureEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(futureEvent.getId(), studentUser.getId()))
                .thenReturn(Optional.empty());

        EventRegistrationResponse response = eventService.rsvpEvent(futureEvent.getId(), studentUser.getEmail());

        assertNotNull(response);
        assertTrue(response.isRegistered());
        assertEquals(11, response.getAttendeeCount());
        verify(eventRegistrationRepository).save(any(EventRegistration.class));
        verify(eventRepository).incrementAttendeeCount(futureEvent.getId());
    }

    @Test
    void rsvpEvent_rejectsAdmin() {
        when(userRepository.findByEmail(adminUser.getEmail())).thenReturn(Optional.of(adminUser));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                eventService.rsvpEvent(futureEvent.getId(), adminUser.getEmail()));

        assertEquals("Chỉ sinh viên và cựu sinh viên mới được đăng ký tham gia sự kiện", ex.getMessage());
        verify(eventRegistrationRepository, never()).save(any());
    }

    @Test
    void rsvpEvent_rejectsPastEvent() {
        Event pastEvent = Event.builder()
                .id(2L)
                .title("Sự kiện đã qua")
                .startTime(Instant.now().minus(2, ChronoUnit.DAYS))
                .capacity(100)
                .attendeeCount(20)
                .build();

        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));
        when(eventRepository.findById(pastEvent.getId())).thenReturn(Optional.of(pastEvent));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                eventService.rsvpEvent(pastEvent.getId(), studentUser.getEmail()));

        assertEquals("Sự kiện đã kết thúc hoặc đang diễn ra, không thể đăng ký.", ex.getMessage());
        verify(eventRegistrationRepository, never()).save(any());
    }

    @Test
    void rsvpEvent_rejectsFullCapacity() {
        Event fullEvent = Event.builder()
                .id(3L)
                .title("Sự kiện hết chỗ")
                .startTime(Instant.now().plus(3, ChronoUnit.DAYS))
                .capacity(10)
                .attendeeCount(10)
                .build();

        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));
        when(eventRepository.findById(fullEvent.getId())).thenReturn(Optional.of(fullEvent));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                eventService.rsvpEvent(fullEvent.getId(), studentUser.getEmail()));

        assertEquals("Sự kiện đã đủ số lượng người tham gia.", ex.getMessage());
        verify(eventRegistrationRepository, never()).save(any());
    }

    @Test
    void rsvpEvent_rejectsDuplicate() {
        EventRegistration existingReg = EventRegistration.builder()
                .id(100L)
                .event(futureEvent)
                .user(studentUser)
                .status("REGISTERED")
                .build();

        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));
        when(eventRepository.findById(futureEvent.getId())).thenReturn(Optional.of(futureEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(futureEvent.getId(), studentUser.getId()))
                .thenReturn(Optional.of(existingReg));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                eventService.rsvpEvent(futureEvent.getId(), studentUser.getEmail()));

        assertEquals("Bạn đã đăng ký tham gia sự kiện này rồi.", ex.getMessage());
    }

    @Test
    void cancelRsvp_success() {
        EventRegistration existingReg = EventRegistration.builder()
                .id(100L)
                .event(futureEvent)
                .user(studentUser)
                .status("REGISTERED")
                .build();

        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));
        when(eventRepository.findById(futureEvent.getId())).thenReturn(Optional.of(futureEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(futureEvent.getId(), studentUser.getId()))
                .thenReturn(Optional.of(existingReg));

        EventRegistrationResponse response = eventService.cancelRsvp(futureEvent.getId(), studentUser.getEmail());

        assertNotNull(response);
        assertFalse(response.isRegistered());
        assertEquals(9, response.getAttendeeCount());
        assertEquals("CANCELLED", existingReg.getStatus());
        verify(eventRegistrationRepository).save(existingReg);
        verify(eventRepository).decrementAttendeeCount(futureEvent.getId());
    }

    @Test
    void cancelRsvp_rejectsIfNotRegistered() {
        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));
        when(eventRepository.findById(futureEvent.getId())).thenReturn(Optional.of(futureEvent));
        when(eventRegistrationRepository.findByEventIdAndUserId(futureEvent.getId(), studentUser.getId()))
                .thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                eventService.cancelRsvp(futureEvent.getId(), studentUser.getEmail()));

        assertEquals("Bạn chưa đăng ký tham gia sự kiện này.", ex.getMessage());
    }
}
