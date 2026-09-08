package com.alumnect.alumnect_backend.service.event;

import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.event.EventCancelResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class EventServiceCancelTest {

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

    private User alumniOrganizer;
    private User studentUser;
    private User otherAlumni;
    private Event futureEvent;

    @BeforeEach
    void setUp() {
        Role alumniRole = new Role();
        alumniRole.setName("ALUMNI");

        Role studentRole = new Role();
        studentRole.setName("STUDENT");

        alumniOrganizer = User.builder()
                .id(1L)
                .email("organizer@fpt.edu.vn")
                .role(alumniRole)
                .build();

        studentUser = User.builder()
                .id(2L)
                .email("student@fpt.edu.vn")
                .role(studentRole)
                .build();

        otherAlumni = User.builder()
                .id(3L)
                .email("other@fpt.edu.vn")
                .role(alumniRole)
                .build();

        futureEvent = Event.builder()
                .id(100L)
                .title("Hội thảo Cựu Sinh Viên 2026")
                .organizer(alumniOrganizer)
                .startTime(Instant.now().plus(7, ChronoUnit.DAYS))
                .endTime(Instant.now().plus(7, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS))
                .capacity(100)
                .attendeeCount(15)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Hủy sự kiện thành công khi người gọi là Alumni và là người tổ chức")
    void testCancelEvent_Success() {
        when(userRepository.findByEmail(alumniOrganizer.getEmail())).thenReturn(Optional.of(alumniOrganizer));
        when(eventRepository.findById(100L)).thenReturn(Optional.of(futureEvent));
        when(eventRepository.save(any(Event.class))).thenReturn(futureEvent);

        EventCancelResponse response = eventService.cancelEvent(100L, alumniOrganizer.getEmail());

        assertNotNull(response);
        assertEquals(100L, response.getEventId());
        assertEquals("CANCELLED", response.getStatus());
        assertEquals("CANCELLED", futureEvent.getStatus());

        verify(eventRegistrationRepository).cancelAllByEventId(100L);
        verify(eventRepository).save(futureEvent);
    }

    @Test
    @DisplayName("Ném ForbiddenException khi người gọi không có role ALUMNI")
    void testCancelEvent_Forbidden_NotAlumni() {
        when(userRepository.findByEmail(studentUser.getEmail())).thenReturn(Optional.of(studentUser));

        ForbiddenException exception = assertThrows(ForbiddenException.class, () ->
                eventService.cancelEvent(100L, studentUser.getEmail()));

        assertTrue(exception.getMessage().contains("Chỉ cựu sinh viên"));
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném ForbiddenException khi người gọi không phải là organizer của sự kiện")
    void testCancelEvent_Forbidden_NotOrganizer() {
        when(userRepository.findByEmail(otherAlumni.getEmail())).thenReturn(Optional.of(otherAlumni));
        when(eventRepository.findById(100L)).thenReturn(Optional.of(futureEvent));

        ForbiddenException exception = assertThrows(ForbiddenException.class, () ->
                eventService.cancelEvent(100L, otherAlumni.getEmail()));

        assertTrue(exception.getMessage().contains("không phải là người tổ chức"));
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném BadRequestException khi sự kiện đã bị CANCELLED từ trước")
    void testCancelEvent_AlreadyCancelled() {
        futureEvent.setStatus("CANCELLED");
        when(userRepository.findByEmail(alumniOrganizer.getEmail())).thenReturn(Optional.of(alumniOrganizer));
        when(eventRepository.findById(100L)).thenReturn(Optional.of(futureEvent));

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                eventService.cancelEvent(100L, alumniOrganizer.getEmail()));

        assertTrue(exception.getMessage().contains("đã bị hủy trước đó"));
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném BadRequestException khi sự kiện đã bắt đầu hoặc đã qua thời gian")
    void testCancelEvent_PastEvent() {
        Event pastEvent = Event.builder()
                .id(101L)
                .title("Sự kiện tuần trước")
                .organizer(alumniOrganizer)
                .startTime(Instant.now().minus(2, ChronoUnit.DAYS))
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail(alumniOrganizer.getEmail())).thenReturn(Optional.of(alumniOrganizer));
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pastEvent));

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                eventService.cancelEvent(101L, alumniOrganizer.getEmail()));

        assertTrue(exception.getMessage().contains("đã kết thúc hoặc đang diễn ra"));
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném ResourceNotFoundException khi không tìm thấy sự kiện")
    void testCancelEvent_EventNotFound() {
        when(userRepository.findByEmail(alumniOrganizer.getEmail())).thenReturn(Optional.of(alumniOrganizer));
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                eventService.cancelEvent(999L, alumniOrganizer.getEmail()));

        verify(eventRepository, never()).save(any());
    }
}
