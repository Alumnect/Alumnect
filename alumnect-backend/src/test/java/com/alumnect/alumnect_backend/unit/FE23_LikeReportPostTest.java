package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.post.PostLikeRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.report.CreatePostReportRequest;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.report.ReportResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostLike;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.report.ReportMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.service.post.PostServiceImpl;
import com.alumnect.alumnect_backend.service.report.ReportServiceImpl;
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

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-23 Like & Report a Post.
 * Report sheet : FE-23 (Report5_Unit_Test.xlsx)
 * Functions    : PostServiceImpl.likePost(), unlikePost(), ReportServiceImpl.reportPost()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-23 Like & Report a Post")
class FE23_LikeReportPostTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private PostRepository postRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private ReportMapper reportMapper;

    // ===== System under test =====
    @InjectMocks
    private PostServiceImpl postService;

    private ReportServiceImpl reportService;

    // ===== Test data =====
    private static final Long POST_ID = 5L;
    private static final Long MEMBER_ID = 1L;
    private static final Long AUTHOR_ID = 2L;
    private static final Long ADMIN_ID = 3L;
    private static final String MEMBER_EMAIL = "student@fpt.edu.vn";
    private static final String AUTHOR_EMAIL = "author@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";

    private User member;
    private User author;
    private User admin;
    private Post activePost;
    private Post hiddenPost;

    @BeforeEach
    void setUp() {
        reportService = new ReportServiceImpl(
                reportRepository,
                postRepository,
                userRepository,
                reportMapper
        );

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        Role adminRole = Role.builder().id(3L).name("ADMIN").build();

        member = User.builder()
                .id(MEMBER_ID)
                .email(MEMBER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        author = User.builder()
                .id(AUTHOR_ID)
                .email(AUTHOR_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        admin = User.builder()
                .id(ADMIN_ID)
                .email(ADMIN_EMAIL)
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        activePost = Post.builder()
                .id(POST_ID)
                .author(author)
                .category(PostCategory.GENERAL)
                .content("Active post content")
                .status(PostStatus.ACTIVE)
                .likeCount(3)
                .build();

        hiddenPost = Post.builder()
                .id(POST_ID)
                .author(author)
                .category(PostCategory.GENERAL)
                .content("Hidden post content")
                .status(PostStatus.HIDDEN)
                .likeCount(3)
                .build();
    }

    // ================= likePost() =================

    @Test
    @DisplayName("UTCID01 - Member has not liked ACTIVE post 5 -> LikeResponse(liked = true, likeCount = 4)")
    void utcid01_likePost_ok() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(false);

        // When
        LikeResponse response = postService.likePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isLiked()).isTrue();
        assertThat(response.getLikeCount()).isEqualTo(4);

        ArgumentCaptor<PostLike> likeCaptor = ArgumentCaptor.forClass(PostLike.class);
        verify(postLikeRepository).save(likeCaptor.capture());
        assertThat(likeCaptor.getValue().getPost()).isEqualTo(activePost);
        assertThat(likeCaptor.getValue().getUser()).isEqualTo(member);

        verify(postRepository).incrementLikeCount(POST_ID);
        verify(notificationService).sendLikeNotification(member, activePost);
    }

    @Test
    @DisplayName("UTCID02 - Member already liked post 5 -> Idempotent LikeResponse(liked = true) with unchanged count")
    void utcid02_likePost_okAlreadyLiked() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(true);

        // When
        LikeResponse response = postService.likePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isLiked()).isTrue();
        assertThat(response.getLikeCount()).isEqualTo(3);
        verify(postLikeRepository, never()).save(any());
        verify(postRepository, never()).incrementLikeCount(anyLong());
        verify(notificationService, never()).sendLikeNotification(any(), any());
    }

    @Test
    @DisplayName("UTCID03 - Account role is ADMIN -> ForbiddenException")
    void utcid03_likePost_forbidden() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> postService.likePost(ADMIN_EMAIL, POST_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được thích bài viết");
        verify(postLikeRepository, never()).save(any());
        verify(postRepository, never()).incrementLikeCount(anyLong());
    }

    @Test
    @DisplayName("UTCID04 - Post 5 is HIDDEN -> ResourceNotFoundException")
    void utcid04_likePost_notFound() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(hiddenPost));

        // When + Then
        assertThatThrownBy(() -> postService.likePost(MEMBER_EMAIL, POST_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết này không còn khả dụng");
        verify(postLikeRepository, never()).save(any());
        verify(postRepository, never()).incrementLikeCount(anyLong());
    }

    // ================= unlikePost() =================

    @Test
    @DisplayName("UTCID05 - Member liked post 5 (likeCount = 3) -> LikeResponse(liked = false, likeCount = 2)")
    void utcid05_unlikePost_ok() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(true);

        // When
        LikeResponse response = postService.unlikePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isLiked()).isFalse();
        assertThat(response.getLikeCount()).isEqualTo(2);
        verify(postLikeRepository).deleteByPostIdAndUserId(POST_ID, MEMBER_ID);
        verify(postRepository).decrementLikeCount(POST_ID);
        verify(notificationService).handleUnlikeNotification(member, activePost);
    }

    @Test
    @DisplayName("UTCID06 - Member liked post 5 with cached likeCount 0 -> likeCount stays 0")
    void utcid06_unlikePost_okCountZero() {
        // Given
        activePost.setLikeCount(0);
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(true);

        // When
        LikeResponse response = postService.unlikePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isLiked()).isFalse();
        assertThat(response.getLikeCount()).isZero();
        verify(postLikeRepository).deleteByPostIdAndUserId(POST_ID, MEMBER_ID);
        verify(postRepository).decrementLikeCount(POST_ID);
        verify(notificationService).handleUnlikeNotification(member, activePost);
    }

    @Test
    @DisplayName("UTCID07 - Member never liked post 5 -> No-op LikeResponse(liked = false)")
    void utcid07_unlikePost_okNeverLiked() {
        // Given
        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, MEMBER_ID)).thenReturn(false);

        // When
        LikeResponse response = postService.unlikePost(MEMBER_EMAIL, POST_ID);

        // Then
        assertThat(response.isLiked()).isFalse();
        assertThat(response.getLikeCount()).isEqualTo(3);
        verify(postLikeRepository, never()).deleteByPostIdAndUserId(anyLong(), anyLong());
        verify(postRepository, never()).decrementLikeCount(anyLong());
        verify(notificationService, never()).handleUnlikeNotification(any(), any());
    }

    // ================= reportPost() =================

    @Test
    @DisplayName("UTCID08 - Member reports ACTIVE post 5 (0 recent reports) -> Report saved with PENDING and trimmed description")
    void utcid08_reportPost_ok() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SPAM");
        request.setDescription("  link spam ");

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(reportRepository.countByReporterIdAndCreatedAtGreaterThanEqual(eq(MEMBER_ID), any(Instant.class)))
                .thenReturn(0L);
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(100L);
            return r;
        });
        ReportResponse expectedResponse = ReportResponse.builder()
                .id(100L)
                .postId(POST_ID)
                .reason(ReportReason.SPAM)
                .description("link spam")
                .status(ReportStatus.PENDING)
                .build();
        when(reportMapper.toResponse(any(Report.class))).thenReturn(expectedResponse);

        // When
        ReportResponse response = reportService.reportPost(MEMBER_EMAIL, POST_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ReportStatus.PENDING);
        assertThat(response.getReason()).isEqualTo(ReportReason.SPAM);
        assertThat(response.getDescription()).isEqualTo("link spam");
        assertThat(activePost.getStatus()).isEqualTo(PostStatus.ACTIVE);

        ArgumentCaptor<Report> reportCaptor = ArgumentCaptor.forClass(Report.class);
        verify(reportRepository).save(reportCaptor.capture());
        Report savedReport = reportCaptor.getValue();
        assertThat(savedReport.getReporter()).isEqualTo(member);
        assertThat(savedReport.getPost()).isEqualTo(activePost);
        assertThat(savedReport.getReason()).isEqualTo(ReportReason.SPAM);
        assertThat(savedReport.getDescription()).isEqualTo("link spam");
        assertThat(savedReport.getStatus()).isEqualTo(ReportStatus.PENDING);
        verify(postRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID09 - Reporter is the author of post 5 -> ForbiddenException")
    void utcid09_reportPost_forbiddenSelf() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SPAM");

        when(userRepository.findByEmail(AUTHOR_EMAIL)).thenReturn(Optional.of(author));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));

        // When + Then
        assertThatThrownBy(() -> reportService.reportPost(AUTHOR_EMAIL, POST_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không thể báo cáo bài viết của chính mình");
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - Member already sent 5 reports in last 10 minutes -> BadRequestException")
    void utcid10_reportPost_badRequestRateLimit() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SPAM");

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(reportRepository.countByReporterIdAndCreatedAtGreaterThanEqual(eq(MEMBER_ID), any(Instant.class)))
                .thenReturn(5L);

        // When + Then
        assertThatThrownBy(() -> reportService.reportPost(MEMBER_EMAIL, POST_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 10 phút");
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Member sent 4 reports in last 10 minutes -> Report accepted and saved")
    void utcid11_reportPost_okBelowLimit() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SCAM_OR_FRAUD");

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(reportRepository.countByReporterIdAndCreatedAtGreaterThanEqual(eq(MEMBER_ID), any(Instant.class)))
                .thenReturn(4L);
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(101L);
            return r;
        });
        ReportResponse expectedResponse = ReportResponse.builder()
                .id(101L)
                .postId(POST_ID)
                .reason(ReportReason.SCAM_OR_FRAUD)
                .status(ReportStatus.PENDING)
                .build();
        when(reportMapper.toResponse(any(Report.class))).thenReturn(expectedResponse);

        // When
        ReportResponse response = reportService.reportPost(MEMBER_EMAIL, POST_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getReason()).isEqualTo(ReportReason.SCAM_OR_FRAUD);
        assertThat(response.getStatus()).isEqualTo(ReportStatus.PENDING);

        ArgumentCaptor<Report> reportCaptor = ArgumentCaptor.forClass(Report.class);
        verify(reportRepository).save(reportCaptor.capture());
        assertThat(reportCaptor.getValue().getReason()).isEqualTo(ReportReason.SCAM_OR_FRAUD);
    }

    @Test
    @DisplayName("UTCID12 - Reason OTHER with blank description -> BadRequestException")
    void utcid12_reportPost_badRequestOtherBlank() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("OTHER");
        request.setDescription("   ");

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(reportRepository.countByReporterIdAndCreatedAtGreaterThanEqual(eq(MEMBER_ID), any(Instant.class)))
                .thenReturn(0L);

        // When + Then
        assertThatThrownBy(() -> reportService.reportPost(MEMBER_EMAIL, POST_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng mô tả lý do báo cáo khác");
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - Invalid reason HATE -> BadRequestException")
    void utcid13_reportPost_badRequestReason() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("HATE");

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(activePost));
        when(reportRepository.countByReporterIdAndCreatedAtGreaterThanEqual(eq(MEMBER_ID), any(Instant.class)))
                .thenReturn(0L);

        // When + Then
        assertThatThrownBy(() -> reportService.reportPost(MEMBER_EMAIL, POST_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn lý do báo cáo");
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID14 - Post 5 is HIDDEN -> ResourceNotFoundException")
    void utcid14_reportPost_notFound() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SPAM");

        when(userRepository.findByEmail(MEMBER_EMAIL)).thenReturn(Optional.of(member));
        when(postRepository.findDetailById(POST_ID)).thenReturn(Optional.of(hiddenPost));

        // When + Then
        assertThatThrownBy(() -> reportService.reportPost(MEMBER_EMAIL, POST_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bài viết này không còn khả dụng");
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID15 - Account role is ADMIN -> ForbiddenException")
    void utcid15_reportPost_forbiddenAdmin() {
        // Given
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SPAM");

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        // When + Then
        assertThatThrownBy(() -> reportService.reportPost(ADMIN_EMAIL, POST_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được báo cáo bài viết");
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID16 - Description length 500 (maximum) -> No constraint violation")
    void utcid16_reportPost_okDescMax() {
        // Given
        CreatePostReportRequest dto = new CreatePostReportRequest();
        dto.setReason("SPAM");
        dto.setDescription("a".repeat(500));
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreatePostReportRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID17 - Description length 501 (above maximum) -> ConstraintViolation")
    void utcid17_reportPost_invalidDescTooLong() {
        // Given
        CreatePostReportRequest dto = new CreatePostReportRequest();
        dto.setReason("SPAM");
        dto.setDescription("a".repeat(501));
        Validator v = Validation.buildDefaultValidatorFactory().getValidator();

        // When
        Set<ConstraintViolation<CreatePostReportRequest>> violations = v.validate(dto);

        // Then
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Mô tả báo cáo không được vượt quá 500 ký tự");
    }
}
