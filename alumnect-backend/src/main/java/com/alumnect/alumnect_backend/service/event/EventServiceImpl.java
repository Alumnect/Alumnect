package com.alumnect.alumnect_backend.service.event;

import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.event.EventAttendeeResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventRegistrationResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.event.EventRegistration;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Triển khai nghiệp vụ cho UC25 - Register to attend an event (RSVP).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional
    public EventRegistrationResponse rsvpEvent(Long eventId, String email) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được đăng ký tham gia sự kiện");

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));

        // Kiểm tra thời gian: nếu sự kiện đã bắt đầu hoặc đã qua thì không cho đăng ký
        if (event.getStartTime() != null && event.getStartTime().isBefore(Instant.now())) {
            throw new BadRequestException("Sự kiện đã kết thúc hoặc đang diễn ra, không thể đăng ký.");
        }

        // Kiểm tra số lượng người tham gia tối đa (capacity)
        if (event.getCapacity() != null && event.getCapacity() > 0 && event.getAttendeeCount() >= event.getCapacity()) {
            throw new BadRequestException("Sự kiện đã đủ số lượng người tham gia.");
        }

        // Kiểm tra đã đăng ký trước đó chưa (BR-12 / BR-13)
        Optional<EventRegistration> existingOpt = eventRegistrationRepository.findByEventIdAndUserId(eventId, user.getId());
        if (existingOpt.isPresent()) {
            EventRegistration existing = existingOpt.get();
            if ("REGISTERED".equalsIgnoreCase(existing.getStatus())) {
                throw new ConflictException("Bạn đã đăng ký tham gia sự kiện này rồi.");
            }
            // Nếu trước đó đã hủy, cập nhật lại trạng thái thành REGISTERED
            existing.setStatus("REGISTERED");
            eventRegistrationRepository.save(existing);
        } else {
            EventRegistration newReg = EventRegistration.builder()
                    .event(event)
                    .user(user)
                    .status("REGISTERED")
                    .build();
            eventRegistrationRepository.save(newReg);
        }

        eventRepository.incrementAttendeeCount(eventId);
        int updatedCount = event.getAttendeeCount() + 1;

        log.info("Người dùng {} đã đăng ký tham gia sự kiện id={}", email, eventId);

        return EventRegistrationResponse.builder()
                .eventId(eventId)
                .registered(true)
                .attendeeCount(updatedCount)
                .capacity(event.getCapacity())
                .message("Đăng ký tham gia sự kiện thành công!")
                .build();
    }

    @Override
    @Transactional
    public EventRegistrationResponse cancelRsvp(Long eventId, String email) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được hủy đăng ký tham gia sự kiện");

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));

        // Không cho phép hủy sau khi sự kiện đã bắt đầu
        if (event.getStartTime() != null && event.getStartTime().isBefore(Instant.now())) {
            throw new BadRequestException("Sự kiện đã kết thúc hoặc đang diễn ra, không thể hủy đăng ký.");
        }

        EventRegistration reg = eventRegistrationRepository.findByEventIdAndUserId(eventId, user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn chưa đăng ký tham gia sự kiện này."));

        if (!"REGISTERED".equalsIgnoreCase(reg.getStatus())) {
            throw new BadRequestException("Bạn chưa đăng ký tham gia sự kiện này.");
        }

        reg.setStatus("CANCELLED");
        eventRegistrationRepository.save(reg);

        eventRepository.decrementAttendeeCount(eventId);
        int updatedCount = Math.max(0, event.getAttendeeCount() - 1);

        log.info("Người dùng {} đã hủy đăng ký sự kiện id={}", email, eventId);

        return EventRegistrationResponse.builder()
                .eventId(eventId)
                .registered(false)
                .attendeeCount(updatedCount)
                .capacity(event.getCapacity())
                .message("Hủy đăng ký tham gia sự kiện thành công!")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EventRegistrationResponse getRsvpStatus(Long eventId, String email) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));

        boolean isRegistered = false;
        if (email != null && !email.isBlank()) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                isRegistered = eventRegistrationRepository.existsByEventIdAndUserIdAndStatus(
                        eventId, userOpt.get().getId(), "REGISTERED");
            }
        }

        return EventRegistrationResponse.builder()
                .eventId(eventId)
                .registered(isRegistered)
                .attendeeCount(event.getAttendeeCount())
                .capacity(event.getCapacity())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventAttendeeResponse> getEventAttendees(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));

        List<EventRegistration> registrations = eventRegistrationRepository
                .findByEventIdAndStatusOrderByCreatedAtAsc(eventId, "REGISTERED");

        if (registrations.isEmpty()) {
            return List.of();
        }

        List<Long> userIds = registrations.stream()
                .map(r -> r.getUser().getId())
                .distinct()
                .collect(Collectors.toList());

        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        return registrations.stream().map(r -> {
            User u = r.getUser();
            UserProfile profile = profileMap.get(u.getId());
            String fullName = profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()
                    ? profile.getFullName()
                    : u.getEmail();
            String avatarUrl = profile != null ? profile.getAvatarUrl() : "";
            String headline = profile != null ? profile.getHeadline() : "";
            String role = u.getRole() != null ? u.getRole().getName() : "";

            return EventAttendeeResponse.builder()
                    .userId(u.getId())
                    .fullName(fullName)
                    .avatarUrl(avatarUrl)
                    .headline(headline)
                    .role(role)
                    .registeredAt(r.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private User resolveMemberOrThrow(String email, String forbiddenMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException(forbiddenMessage);
        }
        return user;
    }
}
