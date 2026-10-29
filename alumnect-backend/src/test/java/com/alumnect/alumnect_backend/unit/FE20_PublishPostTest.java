package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.request.post.EventDto;
import com.alumnect.alumnect_backend.dto.request.post.JobDto;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.entity.job.JobPosting;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostMedia;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-20_Create a Post on the Feed.
 * Report sheet : FE-20 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.createPost()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-20 Create a Post on the Feed")
class FE20_PublishPostTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private JobPostingRepository jobPostingRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private PostMapper postMapper;

    @InjectMocks
    private PostServiceImpl postService;

    private Validator validator;
    private User studentUser;
    private User alumniUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();

        studentUser = User.builder()
                .id(1L)
                .email("student@fpt.edu.vn")
                .role(Role.builder().name("STUDENT").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        alumniUser = User.builder()
                .id(2L)
                .email("alumni@fpt.edu.vn")
                .role(Role.builder().name("ALUMNI").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        adminUser = User.builder()
                .id(3L)
                .email("admin@fpt.edu.vn")
                .role(Role.builder().name("ADMIN").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("UTCID01 - STUDENT account creates GENERAL post -> saved with trimmed content, category GENERAL, 0 counters")
    void utcid01_createPost_studentGeneralSuccess() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());

        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(postMapper.toResponse(any(Post.class), any(), eq(false), eq(false), any(), any(), eq(false)))
                .thenReturn(PostResponse.builder().id("10").build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("  Hello alumni  ")
                .build();

        // When
        PostResponse response = postService.createPost("student@fpt.edu.vn", req);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<Post> captor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(captor.capture());
        Post saved = captor.getValue();
        assertThat(saved.getContent()).isEqualTo("Hello alumni");
        assertThat(saved.getCategory()).isEqualTo(PostCategory.GENERAL);
        assertThat(saved.getStatus()).isEqualTo(PostStatus.ACTIVE);
        assertThat(saved.getLikeCount()).isEqualTo(0);
        assertThat(saved.getCommentCount()).isEqualTo(0);
        assertThat(saved.getRepostCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("UTCID02 - ALUMNI account creates RECRUITMENT post with JobDto -> JobPosting saved and linked with jobId=80")
    void utcid02_createPost_alumniRecruitmentWithJob() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        JobDto jobDto = new JobDto();
        jobDto.setTitle("Software Engineer");
        jobDto.setCompany("FPT Software");
        jobDto.setSalaryMin(BigDecimal.valueOf(15000000L));
        jobDto.setSalaryMax(BigDecimal.valueOf(25000000L));
        jobDto.setApplyUrl("https://fpt.software/careers");

        when(jobPostingRepository.save(any(JobPosting.class))).thenAnswer(inv -> {
            JobPosting j = inv.getArgument(0);
            j.setId(80L);
            return j;
        });

        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(20L);
            return p;
        });
        when(postMapper.toResponse(any(), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenReturn(PostResponse.builder().id("20").build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("RECRUITMENT")
                .content("Hiring developers")
                .job(jobDto)
                .build();

        // When
        PostResponse response = postService.createPost("alumni@fpt.edu.vn", req);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<JobPosting> jobCaptor = ArgumentCaptor.forClass(JobPosting.class);
        verify(jobPostingRepository).save(jobCaptor.capture());
        assertThat(jobCaptor.getValue().getPoster()).isEqualTo(alumniUser);

        ArgumentCaptor<Post> postCaptor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getJobId()).isEqualTo(80L);
    }

    @Test
    @DisplayName("UTCID03 - ALUMNI account creates EVENT post with EventDto -> Event saved and linked with eventId=70")
    void utcid03_createPost_alumniEventWithEventDto() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        Instant now = Instant.now();
        EventDto eventDto = new EventDto();
        eventDto.setTitle("Tech Talk 2026");
        eventDto.setStartTime(now.plus(2, ChronoUnit.DAYS));
        eventDto.setEndTime(now.plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS));
        eventDto.setCapacity(50);

        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(70L);
            return e;
        });

        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(30L);
            return p;
        });
        when(postMapper.toResponse(any(), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenReturn(PostResponse.builder().id("30").build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("EVENT")
                .content("Join tech talk")
                .event(eventDto)
                .build();

        // When
        PostResponse response = postService.createPost("alumni@fpt.edu.vn", req);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getOrganizer()).isEqualTo(alumniUser);

        ArgumentCaptor<Post> postCaptor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getEventId()).isEqualTo(70L);
    }

    @Test
    @DisplayName("UTCID04 - mediaUrls = [' a.png ', '', 'b.png'] -> 2 PostMedia attached, blank skipped, sortOrder 0 and 2")
    void utcid04_createPost_mediaUrlsFilteringAndSortOrder() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postMapper.toResponse(any(), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenReturn(PostResponse.builder().build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("Pictures")
                .mediaUrls(List.of(" a.png ", "", "b.png"))
                .build();

        // When
        postService.createPost("student@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<Post> captor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(captor.capture());
        List<PostMedia> mediaList = captor.getValue().getMediaList();
        assertThat(mediaList).hasSize(2);
        assertThat(mediaList.get(0).getUrl()).isEqualTo("a.png");
        assertThat(mediaList.get(0).getSortOrder()).isEqualTo((short) 0);
        assertThat(mediaList.get(1).getUrl()).isEqualTo("b.png");
        assertThat(mediaList.get(1).getSortOrder()).isEqualTo((short) 2);
    }

    @Test
    @DisplayName("UTCID05 - legacy imageUrl = 'cover.png', mediaUrls = null -> 1 PostMedia created")
    void utcid05_createPost_legacyImageUrlFallback() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postMapper.toResponse(any(), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenReturn(PostResponse.builder().build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("Legacy image")
                .imageUrl("cover.png")
                .mediaUrls(null)
                .build();

        // When
        postService.createPost("student@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<Post> captor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(captor.capture());
        List<PostMedia> mediaList = captor.getValue().getMediaList();
        assertThat(mediaList).hasSize(1);
        assertThat(mediaList.get(0).getUrl()).isEqualTo("cover.png");
        assertThat(mediaList.get(0).getSortOrder()).isEqualTo((short) 0);
    }

    @Test
    @DisplayName("UTCID06 - type = 'normal' legacy alias maps category to GENERAL")
    void utcid06_createPost_normalMapsToGeneral() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postMapper.toResponse(any(), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenReturn(PostResponse.builder().build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("normal")
                .content("Normal post")
                .build();

        // When
        postService.createPost("student@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<Post> captor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(captor.capture());
        assertThat(captor.getValue().getCategory()).isEqualTo(PostCategory.GENERAL);
    }

    @Test
    @DisplayName("UTCID07 - No account for email -> ResourceNotFoundException")
    void utcid07_createPost_userNotFound() {
        // Given
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());
        CreatePostRequest req = CreatePostRequest.builder().type("GENERAL").content("Hi").build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("ghost@fpt.edu.vn", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng");
    }

    @Test
    @DisplayName("UTCID08 - Role ADMIN cannot publish post -> ForbiddenException")
    void utcid08_createPost_adminForbidden() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(adminUser));
        CreatePostRequest req = CreatePostRequest.builder().type("GENERAL").content("Admin post").build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("admin@fpt.edu.vn", req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được đăng bài viết");
    }

    @Test
    @DisplayName("UTCID09 - Invalid type 'FOO' -> BadRequestException")
    void utcid09_createPost_invalidType() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        CreatePostRequest req = CreatePostRequest.builder().type("FOO").content("Content").build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("student@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Loại bài viết không hợp lệ: FOO");
    }

    @Test
    @DisplayName("UTCID10 - EVENT with past startTime -> BadRequestException")
    void utcid10_createPost_pastStartTime() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        EventDto eventDto = new EventDto();
        eventDto.setStartTime(Instant.now().minus(1, ChronoUnit.DAYS));
        CreatePostRequest req = CreatePostRequest.builder()
                .type("EVENT")
                .content("Past event")
                .event(eventDto)
                .build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("alumni@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời gian bắt đầu sự kiện không thể ở trong quá khứ.");
    }

    @Test
    @DisplayName("UTCID11 - EVENT with endTime earlier than startTime -> BadRequestException")
    void utcid11_createPost_endTimeBeforeStartTime() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        EventDto eventDto = new EventDto();
        eventDto.setStartTime(start);
        eventDto.setEndTime(start.minus(1, ChronoUnit.HOURS));

        CreatePostRequest req = CreatePostRequest.builder()
                .type("EVENT")
                .content("Invalid duration event")
                .event(eventDto)
                .build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("alumni@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời gian kết thúc phải sau thời gian bắt đầu.");
    }

    @Test
    @DisplayName("UTCID12 - EVENT capacity = 0 (below minimum 1) -> BadRequestException")
    void utcid12_createPost_capacityZero() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        EventDto eventDto = new EventDto();
        eventDto.setStartTime(start);
        eventDto.setEndTime(start.plus(2, ChronoUnit.HOURS));
        eventDto.setCapacity(0);

        CreatePostRequest req = CreatePostRequest.builder()
                .type("EVENT")
                .content("Zero capacity")
                .event(eventDto)
                .build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("alumni@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sức chứa sự kiện phải lớn hơn hoặc bằng 1.");
    }

    @Test
    @DisplayName("UTCID13 - EVENT capacity = 1 (minimum accepted) -> saved with capacity 1")
    void utcid13_createPost_capacityOne() {
        // Given
        when(userRepository.findByEmail("alumni@fpt.edu.vn")).thenReturn(Optional.of(alumniUser));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        EventDto eventDto = new EventDto();
        eventDto.setTitle("1 on 1");
        eventDto.setStartTime(start);
        eventDto.setEndTime(start.plus(1, ChronoUnit.HOURS));
        eventDto.setCapacity(1);

        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(71L);
            return e;
        });
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postMapper.toResponse(any(), any(), anyBoolean(), anyBoolean(), any(), any(), anyBoolean()))
                .thenReturn(PostResponse.builder().build());

        CreatePostRequest req = CreatePostRequest.builder()
                .type("EVENT")
                .content("One person session")
                .event(eventDto)
                .build();

        // When
        postService.createPost("alumni@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getCapacity()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID14 - Database save fails -> RuntimeException with wrapped message")
    void utcid14_createPost_dbError() {
        // Given
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(postRepository.save(any(Post.class))).thenThrow(new RuntimeException("DB Connection failed"));

        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("Test fail")
                .build();

        // When + Then
        assertThatThrownBy(() -> postService.createPost("student@fpt.edu.vn", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Lỗi hệ thống: Không thể tạo bài viết");
    }

    // ================= DTO Validation =================

    @Test
    @DisplayName("UTCID15 - DTO validation: content 5000 chars (max boundary) passes")
    void utcid15_validation_content5000Chars() {
        // Given
        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("a".repeat(5000))
                .build();

        // When
        Set<ConstraintViolation<CreatePostRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID16 - DTO validation: content 5001 chars -> ConstraintViolation max 5000")
    void utcid16_validation_content5001Chars() {
        // Given
        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("a".repeat(5001))
                .build();

        // When
        Set<ConstraintViolation<CreatePostRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Nội dung bài viết không được vượt quá 5000 ký tự");
    }

    @Test
    @DisplayName("UTCID17 - DTO validation: content blank -> ConstraintViolation not blank")
    void utcid17_validation_contentBlank() {
        // Given
        CreatePostRequest req = CreatePostRequest.builder()
                .type("GENERAL")
                .content("   ")
                .build();

        // When
        Set<ConstraintViolation<CreatePostRequest>> violations = validator.validate(req);

        // Then
        assertThat(violations).isNotEmpty();
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Nội dung bài viết không được để trống");
    }
}
