package com.alumnect.alumnect_backend.service.event;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.event.EventRegistrationRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.event.EventAttendeeResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventCancelResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventHistoryResponse;
import com.alumnect.alumnect_backend.dto.response.event.EventRegistrationResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.event.EventRegistration;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    private final PostRepository postRepository;

    @Override
    @Transactional
    public EventRegistrationResponse rsvpEvent(Long eventId, String email) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được đăng ký tham gia sự kiện");

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));

        // Kiểm tra sự kiện có bị hủy không
        if ("CANCELLED".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Sự kiện này đã bị hủy, không thể đăng ký.");
        }

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

        // Không cho phép hủy sau khi sự kiện đã bắt đầu hoặc đã bị hủy
        if ("CANCELLED".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Sự kiện này đã bị hủy.");
        }

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
        return getEventAttendees(eventId, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventAttendeeResponse> getEventAttendees(Long eventId, String search, String role) {
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

        String normalizedSearch = (search != null) ? search.trim().toLowerCase() : null;
        String normalizedRole = (role != null && !role.isBlank() && !role.equalsIgnoreCase("ALL"))
                ? role.trim().toUpperCase()
                : null;

        List<EventAttendeeResponse> list = registrations.stream().map(r -> {
            User u = r.getUser();
            UserProfile profile = profileMap.get(u.getId());
            String fullName = profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()
                    ? profile.getFullName()
                    : u.getEmail();
            String avatarUrl = profile != null ? profile.getAvatarUrl() : "";
            String headline = profile != null ? profile.getHeadline() : "";
            if ((headline == null || headline.isBlank()) && profile != null && profile.getMajor() != null) {
                headline = profile.getMajor().getName();
            }
            String uRole = u.getRole() != null ? u.getRole().getName() : "";

            return EventAttendeeResponse.builder()
                    .userId(u.getId())
                    .fullName(fullName)
                    .avatarUrl(avatarUrl)
                    .headline(headline != null ? headline : "")
                    .role(uRole)
                    .registeredAt(r.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        if (normalizedRole != null) {
            list = list.stream()
                    .filter(a -> a.getRole() != null && a.getRole().equalsIgnoreCase(normalizedRole))
                    .collect(Collectors.toList());
        }

        if (normalizedSearch != null && !normalizedSearch.isBlank()) {
            list = list.stream()
                    .filter(a -> (a.getFullName() != null && a.getFullName().toLowerCase().contains(normalizedSearch))
                            || (a.getHeadline() != null && a.getHeadline().toLowerCase().contains(normalizedSearch)))
                    .collect(Collectors.toList());
        }

        return list;
    }

    @Override
    @Transactional
    public EventCancelResponse cancelEvent(Long eventId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        String role = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!"ALUMNI".equals(role)) {
            throw new ForbiddenException("Chỉ cựu sinh viên (người tổ chức) mới có quyền hủy sự kiện.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));

        // Kiểm tra quyền sở hữu: chỉ người tạo (organizer) mới được hủy sự kiện
        if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền hủy sự kiện này vì không phải là người tổ chức.");
        }

        // Kiểm tra nếu sự kiện đã bị hủy trước đó
        if ("CANCELLED".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Sự kiện này đã bị hủy trước đó.");
        }

        // Kiểm tra nếu sự kiện đã kết thúc hoặc đang diễn ra
        if (event.getStartTime() != null && event.getStartTime().isBefore(Instant.now())) {
            throw new BadRequestException("Sự kiện đã kết thúc hoặc đang diễn ra, không thể hủy.");
        }

        // Cập nhật trạng thái sự kiện thành CANCELLED
        event.setStatus("CANCELLED");
        eventRepository.save(event);

        // Chuyển toàn bộ đăng ký đang REGISTERED sang CANCELLED
        eventRegistrationRepository.cancelAllByEventId(eventId);

        log.info("Sự kiện id={} đã bị hủy bởi organizer email={}", eventId, email);

        return EventCancelResponse.builder()
                .eventId(eventId)
                .status("CANCELLED")
                .message("Hủy sự kiện thành công!")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EventHistoryResponse> getEventHistory(String email, int page, int size, String filter) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới có lịch sử tham gia sự kiện");

        String normalizedFilter = (filter == null || filter.isBlank()) ? "all" : filter.trim().toLowerCase();
        if (!normalizedFilter.equals("all") && !normalizedFilter.equals("upcoming")
                && !normalizedFilter.equals("past") && !normalizedFilter.equals("cancelled")) {
            normalizedFilter = "all";
        }

        int validPage = Math.max(0, page);
        int validSize = (size <= 0 || size > 50) ? 10 : size;
        Pageable pageable = PageRequest.of(validPage, validSize);

        Page<EventRegistration> regPage = eventRegistrationRepository.findUserEventHistory(
                user.getId(), normalizedFilter, pageable);

        if (regPage.isEmpty()) {
            return PageResponse.<EventHistoryResponse>builder()
                    .content(List.of())
                    .pageNumber(validPage)
                    .pageSize(validSize)
                    .totalElements(regPage.getTotalElements())
                    .totalPages(regPage.getTotalPages())
                    .last(true)
                    .build();
        }

        // Lấy danh sách ID các sự kiện để batch fetch bài viết
        List<Long> eventIds = regPage.getContent().stream()
                .map(r -> r.getEvent().getId())
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Post> postMap = postRepository.findActiveByEventIdIn(eventIds).stream()
                .collect(Collectors.toMap(Post::getEventId, Function.identity(), (p1, p2) -> p1));

        // Lấy danh sách ID người tổ chức để batch fetch hồ sơ
        List<Long> organizerIds = regPage.getContent().stream()
                .map(r -> r.getEvent().getOrganizer().getId())
                .distinct()
                .collect(Collectors.toList());

        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(organizerIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        Instant now = Instant.now();
        List<EventHistoryResponse> content = regPage.getContent().stream().map(reg -> {
            Event event = reg.getEvent();
            User organizer = event.getOrganizer();
            UserProfile orgProfile = profileMap.get(organizer.getId());
            Post post = postMap.get(event.getId());

            String orgName = (orgProfile != null && orgProfile.getFullName() != null && !orgProfile.getFullName().isBlank())
                    ? orgProfile.getFullName()
                    : organizer.getEmail();
            String orgAvatar = orgProfile != null ? orgProfile.getAvatarUrl() : "";

            String coverUrl = (post != null && post.getMediaList() != null && !post.getMediaList().isEmpty())
                    ? post.getMediaList().get(0).getUrl()
                    : null;
            Long postId = post != null ? post.getId() : null;

            // Tính toán trạng thái thực tế phục vụ UI
            String attendanceState;
            if ("CANCELLED".equalsIgnoreCase(event.getStatus())) {
                attendanceState = "EVENT_CANCELLED";
            } else if ("CANCELLED".equalsIgnoreCase(reg.getStatus())) {
                attendanceState = "REGISTRATION_CANCELLED";
            } else if (event.getStartTime() != null && event.getStartTime().isAfter(now)) {
                attendanceState = "UPCOMING";
            } else if (event.getEndTime() != null && event.getEndTime().isBefore(now)) {
                attendanceState = "PAST";
            } else if (event.getStartTime() != null && event.getStartTime().isBefore(now)
                    && event.getEndTime() != null && event.getEndTime().isAfter(now)) {
                attendanceState = "ONGOING";
            } else {
                attendanceState = "PAST";
            }

            return EventHistoryResponse.builder()
                    .registrationId(reg.getId())
                    .registrationStatus(reg.getStatus())
                    .registeredAt(reg.getCreatedAt())
                    .eventId(event.getId())
                    .title(event.getTitle())
                    .location(event.getLocation())
                    .startTime(event.getStartTime())
                    .endTime(event.getEndTime())
                    .capacity(event.getCapacity())
                    .attendeeCount(event.getAttendeeCount())
                    .eventStatus(event.getStatus())
                    .postId(postId)
                    .coverUrl(coverUrl)
                    .organizerId(organizer.getId())
                    .organizerName(orgName)
                    .organizerAvatar(orgAvatar)
                    .attendanceState(attendanceState)
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.<EventHistoryResponse>builder()
                .content(content)
                .pageNumber(regPage.getNumber())
                .pageSize(regPage.getSize())
                .totalElements(regPage.getTotalElements())
                .totalPages(regPage.getTotalPages())
                .last(regPage.isLast())
                .build();
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
