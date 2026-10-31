package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.service.moderation.ProfanityFilterServiceImpl;
import com.alumnect.alumnect_backend.service.moderation.ContentModerationServiceImpl;
import com.alumnect.alumnect_backend.service.moderation.ReportModerationListener;
import com.alumnect.alumnect_backend.service.moderation.ModerationResult;
import com.alumnect.alumnect_backend.service.moderation.ReportCreatedEvent;
import com.alumnect.alumnect_backend.service.moderation.PostCreatedModerationEvent;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * FE-65: Unit Test cho Hệ thống Kiểm duyệt Nội dung Tự động và Bộ lọc Từ cấm Đa ngôn ngữ (UC123 / UC24-UC69).
 * Kiểm thử:
 * 1. ProfanityFilterServiceImpl: Quét từ cấm Vi/En, leetspeak, whitelist
 * 2. ContentModerationServiceImpl: Phân tầng điểm số và ngưỡng hành động (autoHide / requiresReview)
 * 3. ReportModerationListener: Xử lý ngầm, ẩn bài vi phạm nặng và thông báo WebSocket tới Admin
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-65 Content Moderation & Multilingual Profanity Pipeline")
class FE65_ContentModerationProfanityTest {

    private ProfanityFilterServiceImpl profanityFilterService;
    private ContentModerationServiceImpl contentModerationService;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationService notificationService;

    private ReportModerationListener moderationListener;

    @BeforeEach
    void setUp() {
        // Khởi tạo ProfanityFilterService và nạp tài nguyên thực tế từ test classpath
        profanityFilterService = new ProfanityFilterServiceImpl();
        profanityFilterService.init();

        contentModerationService = new ContentModerationServiceImpl(profanityFilterService);
        moderationListener = new ReportModerationListener(
                contentModerationService,
                reportRepository,
                postRepository,
                messagingTemplate,
                notificationService
        );
    }

    // ==========================================
    // 1. KIỂM THỬ BỘ LỌC TỪ CẤM (PROFANITY FILTER)
    // ==========================================

    @Test
    @DisplayName("Quét từ cấm tiếng Việt có dấu: Phát hiện chính xác")
    void containsProfanity_VietnameseWithAccents_ReturnsTrue() {
        String toxicText = "Thằng này đúng là một đồ óc chó đáng ghét";
        boolean result = profanityFilterService.containsProfanity(toxicText);
        List<String> keywords = profanityFilterService.findProfanities(toxicText);

        assertThat(result).isTrue();
        assertThat(keywords).isNotEmpty();
    }

    @Test
    @DisplayName("Quét từ cấm tiếng Việt không dấu: Phát hiện chính xác")
    void containsProfanity_VietnameseWithoutAccents_ReturnsTrue() {
        String toxicText = "may dung la do ngu nhu bo cut me may di";
        boolean result = profanityFilterService.containsProfanity(toxicText);
        List<String> keywords = profanityFilterService.findProfanities(toxicText);

        assertThat(result).isTrue();
        assertThat(keywords).isNotEmpty();
    }

    @Test
    @DisplayName("Quét từ cấm leetspeak và ký tự xen kẽ: Phát hiện chính xác")
    void containsProfanity_LeetspeakVariation_ReturnsTrue() {
        String leetspeakText = "thang d.m nay may chet me may voi tao";
        boolean result = profanityFilterService.containsProfanity(leetspeakText);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Quét từ cấm tiếng Anh: Phát hiện chính xác")
    void containsProfanity_EnglishVulgarWords_ReturnsTrue() {
        String englishText = "What the fuck is this bullshit project";
        boolean result = profanityFilterService.containsProfanity(englishText);
        List<String> keywords = profanityFilterService.findProfanities(englishText);

        assertThat(result).isTrue();
        assertThat(keywords).contains("fuck");
    }

    @Test
    @DisplayName("Văn bản an toàn trong Whitelist: Không bắt nhầm (Zero False-Positive)")
    void containsProfanity_SafeTextAndWhitelist_ReturnsFalse() {
        String safeText = "Chào mừng các bạn sinh viên FPT University tham gia câu lạc bộ bóng đá Alumnect";
        boolean result = profanityFilterService.containsProfanity(safeText);
        List<String> keywords = profanityFilterService.findProfanities(safeText);

        assertThat(result).isFalse();
        assertThat(keywords).isEmpty();
    }

    @Test
    @DisplayName("Che từ cấm (maskProfanity): Thay thế các từ cấm bằng chuỗi hoa thị ***")
    void maskProfanity_ReplacesBadWordsWithAsterisks() {
        String input = "Đồ con chó này cút mẹ mày đi";
        String masked = profanityFilterService.maskProfanity(input);

        assertThat(masked).contains("***");
    }

    // ==========================================
    // 2. KIỂM THỬ THUẬT TOÁN ĐÁNH GIÁ (CONTENT MODERATION)
    // ==========================================

    @Test
    @DisplayName("Nội dung an toàn: Điểm rủi ro < 0.40, autoHide=false, requiresReview=false")
    void evaluateContent_SafeContent_ReturnsLowScore() {
        String content = "Hôm nay mình vừa bảo vệ đồ án tốt nghiệp FPT thành công!";
        ModerationResult result = contentModerationService.evaluateContent(content);

        assertThat(result.getScore()).isLessThan(0.40);
        assertThat(result.isAutoHide()).isFalse();
        assertThat(result.isRequiresReview()).isFalse();
    }

    @Test
    @DisplayName("Nội dung nghi vấn vừa phải (1 từ cấm): 0.40 <= Score < 0.85, requiresReview=true, autoHide=false")
    void evaluateContent_SingleProfanity_RequiresHumanReview() {
        String content = "Bài thi lần này khó vãi lồn thật sự luôn";
        ModerationResult result = contentModerationService.evaluateContent(content);

        assertThat(result.getScore()).isGreaterThanOrEqualTo(0.40);
        assertThat(result.isRequiresReview()).isTrue();
        assertThat(result.isAutoHide()).isFalse();
    }

    @Test
    @DisplayName("Nội dung cực kỳ độc hại (nhiều từ cấm/lăng mạ nặng): Score >= 0.85, autoHide=true")
    void evaluateContent_MultipleProfanities_TriggersAutoHide() {
        String content = "Địt mẹ mày thằng súc vật óc chó chết tiệt cút mẹ mày đi";
        ModerationResult result = contentModerationService.evaluateContent(content);

        assertThat(result.getScore()).isGreaterThanOrEqualTo(0.85);
        assertThat(result.isAutoHide()).isTrue();
        assertThat(result.isRequiresReview()).isFalse();
    }

    // ==========================================
    // 3. KIỂM THỬ XỬ LÝ SỰ KIỆN BẤT ĐỒNG BỘ (LISTENER)
    // ==========================================

    @Test
    @DisplayName("Listener: Khi bài viết vi phạm nghiêm trọng (Score >= 0.85) -> Tự động ẩn bài và alert WebSocket")
    void handleReportCreated_CriticalViolation_AutoHidesPostAndAlertsAdmin() {
        Long reportId = 101L;
        Long postId = 501L;
        String toxicContent = "Địt mẹ mày thằng súc vật óc chó cút mẹ mày đi";

        User author = User.builder().id(1L).email("author@fpt.edu.vn").build();
        User reporter = User.builder().id(2L).email("reporter@fpt.edu.vn").build();

        Post post = Post.builder()
                .id(postId)
                .author(author)
                .content(toxicContent)
                .category(PostCategory.GENERAL)
                .status(PostStatus.ACTIVE)
                .build();

        Report report = Report.builder()
                .id(reportId)
                .post(post)
                .reporter(reporter)
                .reason(ReportReason.INAPPROPRIATE)
                .status(ReportStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(reportId)
                .postId(postId)
                .postContent(toxicContent)
                .reason("INAPPROPRIATE")
                .reporterId(2L)
                .build();

        // Kích hoạt Listener
        moderationListener.handleReportCreated(event);

        // Kiểm chứng: Bài viết bị đổi sang HIDDEN và được lưu xuống DB
        assertThat(post.getStatus()).isEqualTo(PostStatus.HIDDEN);
        verify(postRepository, times(1)).save(post);

        // Kiểm chứng: Báo cáo được cập nhật điểm AI và cờ autoModerated=true
        assertThat(report.getAutoModerated()).isTrue();
        assertThat(report.getAiScore()).isGreaterThanOrEqualTo(0.85);
        verify(reportRepository, times(1)).save(report);

        // Kiểm chứng: Bắn cảnh báo khẩn cấp tới kênh WebSocket của Admin
        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/admin/moderation-alerts"),
                any(Object.class)
        );
    }

    @Test
    @DisplayName("Listener: Khi bài viết nghi vấn vừa phải (Score < 0.85) -> Giữ nguyên trạng thái bài viết ACTIVE")
    void handleReportCreated_ModerateViolation_LeavesPostActive() {
        Long reportId = 102L;
        Long postId = 502L;
        String moderateContent = "Đề thi khó vãi lồn";

        User author = User.builder().id(1L).email("author@fpt.edu.vn").build();
        User reporter = User.builder().id(2L).email("reporter@fpt.edu.vn").build();

        Post post = Post.builder()
                .id(postId)
                .author(author)
                .content(moderateContent)
                .category(PostCategory.GENERAL)
                .status(PostStatus.ACTIVE)
                .build();

        Report report = Report.builder()
                .id(reportId)
                .post(post)
                .reporter(reporter)
                .reason(ReportReason.INAPPROPRIATE)
                .status(ReportStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(reportId)
                .postId(postId)
                .postContent(moderateContent)
                .reason("INAPPROPRIATE")
                .reporterId(2L)
                .build();

        moderationListener.handleReportCreated(event);

        // Bài viết không bị tự động ẩn
        assertThat(post.getStatus()).isEqualTo(PostStatus.ACTIVE);
        verify(postRepository, never()).save(post);

        // Báo cáo được cập nhật điểm nhưng autoModerated=false
        assertThat(report.getAutoModerated()).isFalse();
        assertThat(report.getAiScore()).isLessThan(0.85);
        verify(reportRepository, times(1)).save(report);
    }

    // ==========================================
    // 4. KIỂM THỬ CHIẾN LƯỢC FACEBOOK (POST-FIRST, MODERATE-LATER)
    // ==========================================

    @Test
    @DisplayName("Facebook Pipeline: Bài viết mới đăng chứa vi phạm nghiêm trọng -> Tự động ẩn bài ngầm và tạo Report cho Admin")
    void handlePostCreated_SevereViolation_AutoHidesPostAndCreatesReport() {
        Long postId = 701L;
        String toxicContent = "Thằng súc vật óc chó chết tiệt cút mẹ mày đi";
        User author = User.builder().id(10L).email("baduser@fpt.edu.vn").build();

        Post post = Post.builder()
                .id(postId)
                .author(author)
                .content(toxicContent)
                .status(PostStatus.ACTIVE)
                .build();

        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        PostCreatedModerationEvent event = PostCreatedModerationEvent.builder()
                .postId(postId)
                .content(toxicContent)
                .authorId(10L)
                .build();

        moderationListener.handlePostCreated(event);

        // Bài viết bị tự động ẩn ngầm
        assertThat(post.getStatus()).isEqualTo(PostStatus.HIDDEN);
        verify(postRepository, times(1)).save(post);

        // Hệ thống tự tạo 1 bản ghi Report gửi Admin
        verify(reportRepository, times(1)).save(any(Report.class));

        // Alert khẩn cấp gửi WebSocket
        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/admin/moderation-alerts"),
                any(Object.class)
        );
    }

    @Test
    @DisplayName("Facebook Pipeline: Bài viết mới đăng an toàn -> Giữ nguyên ACTIVE và không tạo Report rác")
    void handlePostCreated_SafePost_DoesNothing() {
        Long postId = 702L;
        String safeContent = "Chia sẻ kinh nghiệm phỏng vấn tại FPT Software cho các bạn sinh viên";
        User author = User.builder().id(11L).email("gooduser@fpt.edu.vn").build();

        Post post = Post.builder()
                .id(postId)
                .author(author)
                .content(safeContent)
                .status(PostStatus.ACTIVE)
                .build();

        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        PostCreatedModerationEvent event = PostCreatedModerationEvent.builder()
                .postId(postId)
                .content(safeContent)
                .authorId(11L)
                .build();

        moderationListener.handlePostCreated(event);

        // Bài viết giữ nguyên ACTIVE
        assertThat(post.getStatus()).isEqualTo(PostStatus.ACTIVE);
        verify(postRepository, never()).save(post);

        // Không tạo report rác
        verify(reportRepository, never()).save(any(Report.class));
    }

    // ==========================================
    // 5. KIỂM THỬ CÁC TỪ LÓNG & TỪ VIẾT TẮT MỚI THÊM (SLANG & ABBREVIATIONS)
    // ==========================================

    @Test
    @DisplayName("Quét các từ lóng mới thêm: cl, cc, cai lon, con cac -> Phát hiện chính xác")
    void containsProfanity_NewSlangTerms_DetectedSuccessfully() {
        String slangText1 = "Mày nói cái cl gì thế?";
        String slangText2 = "Im mẹ mồm đi đồ con cac";
        String slangText3 = "Nói chuyện như cc";
        String slangText4 = "Mày nói cl gì thế?";
        String slangText5 = "Ăn cc đi";

        assertThat(profanityFilterService.containsProfanity(slangText1)).isTrue();
        assertThat(profanityFilterService.findProfanities(slangText1)).contains("cái cl");

        assertThat(profanityFilterService.containsProfanity(slangText2)).isTrue();
        assertThat(profanityFilterService.findProfanities(slangText2)).contains("con cặc");

        assertThat(profanityFilterService.containsProfanity(slangText3)).isTrue();
        assertThat(profanityFilterService.findProfanities(slangText3)).contains("như cc");

        assertThat(profanityFilterService.containsProfanity(slangText4)).isTrue();
        assertThat(profanityFilterService.findProfanities(slangText4)).contains("nói cl");

        assertThat(profanityFilterService.containsProfanity(slangText5)).isTrue();
        assertThat(profanityFilterService.findProfanities(slangText5)).contains("ăn cc");
    }

    @Test
    @DisplayName("Bảo vệ biên từ vựng: CLB Tin học, CCCD không bị bắt nhầm thành cl hay cc")
    void containsProfanity_AcronymsWithBoundary_NotFalsePositive() {
        String safeText1 = "Mời các bạn tham gia CLB Tin học Đại học FPT tuần này nhé";
        String safeText2 = "Sinh viên chuẩn bị nộp CCCD để làm thủ tục tốt nghiệp";

        assertThat(profanityFilterService.containsProfanity(safeText1)).isFalse();
        assertThat(profanityFilterService.findProfanities(safeText1)).doesNotContain("cl");

        assertThat(profanityFilterService.containsProfanity(safeText2)).isFalse();
        assertThat(profanityFilterService.findProfanities(safeText2)).doesNotContain("cc");
    }

    @Test
    @DisplayName("Bảo vệ Whitelist: 'các bạn' không bị bắt nhầm bởi từ đơn 'cac'")
    void containsProfanity_CacBanWithWhitelist_NotFlaggedAsCac() {
        String safePost = "Xin chào các bạn cựu sinh viên FPT";

        assertThat(profanityFilterService.containsProfanity(safePost)).isFalse();
        assertThat(profanityFilterService.findProfanities(safePost)).doesNotContain("cac");
    }
}
