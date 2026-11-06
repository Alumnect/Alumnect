package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostMedia;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Kiểm thử đơn vị cho tính năng kiểm duyệt hình ảnh bài viết bằng Gemini AI (nhị phân, Post-First).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AI Image Moderation (Gemini Vision + ReportModerationListener)")
class ImageModerationTest {

    @Mock
    private ContentModerationService contentModerationService;

    @Mock
    private ImageModerationService imageModerationService;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReportModerationListener listener;

    private HttpServer localServer;

    @AfterEach
    void tearDown() {
        if (localServer != null) {
            localServer.stop(0);
        }
    }

    @Test
    @DisplayName("1. Chưa cấu hình GEMINI_API_KEY -> bỏ qua an toàn, không lỗi")
    void missingApiKey_returnsSafeWithoutException() {
        GeminiImageModerationServiceImpl service = new GeminiImageModerationServiceImpl(true, "", "gemini-2.5-flash");
        ImageModerationResult result = service.checkImages(
                List.of("https://pub-example.r2.dev/posts/test.jpg"),
                "Bài viết bình thường"
        );
        assertThat(result.violated()).isFalse();
        assertThat(result.category()).isEqualTo(ImageModerationResult.CATEGORY_SAFE);
    }

    @Test
    @DisplayName("2. Thu nhỏ ảnh lớn (1600x1200 PNG) xuống thumbnail <= 512px JPEG ngay trong RAM")
    void compressToThumbnail_scalesDownLargeImageTo512pxJpeg() throws Exception {
        byte[] largePng = createSamplePng(1600, 1200);
        GeminiImageModerationServiceImpl service = new GeminiImageModerationServiceImpl(true, "test-key", "gemini-2.5-flash");

        GeminiImageModerationServiceImpl.PreparedImage prepared =
                service.compressToThumbnail(largePng, "image/png", "sample.png");

        assertThat(prepared).isNotNull();
        assertThat(prepared.mimeType()).isEqualTo("image/jpeg");
        byte[] decoded = Base64.getDecoder().decode(prepared.base64Data());
        BufferedImage thumb = ImageIO.read(new ByteArrayInputStream(decoded));
        assertThat(thumb.getWidth()).isEqualTo(512);
        assertThat(thumb.getHeight()).isEqualTo(384);
    }

    @Test
    @DisplayName("3. Gemini trả về kết quả vi phạm SENSITIVE_NSFW -> phát hiện đúng ảnh và lý do")
    void geminiDetectsSensitiveImage_returnsViolatedTrue() throws Exception {
        byte[] samplePng = createSamplePng(800, 600);
        AtomicReference<String> receivedApiKey = new AtomicReference<>();

        localServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        localServer.createContext("/media/nsfw-photo.png", exchange -> {
            exchange.getResponseHeaders().add("Content-Type", "image/png");
            exchange.sendResponseHeaders(200, samplePng.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(samplePng);
            }
        });
        localServer.createContext("/v1beta/models/gemini-2.5-flash:generateContent", exchange -> {
            receivedApiKey.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            String geminiJson = """
                    {
                      "candidates": [{
                        "finishReason": "STOP",
                        "content": {
                          "parts": [{
                            "text": "{\\"violated\\": true, \\"category\\": \\"SENSITIVE_NSFW\\", \\"reason\\": \\"Hình ảnh chứa nội dung 18+ phản cảm\\", \\"violatedImageIndex\\": 1}"
                          }]
                        }
                      }]
                    }
                    """;
            byte[] respBytes = geminiJson.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, respBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(respBytes);
            }
        });
        localServer.start();

        int port = localServer.getAddress().getPort();
        String baseUrl = "http://127.0.0.1:" + port;
        GeminiImageModerationServiceImpl service = new GeminiImageModerationServiceImpl(
                true,
                "secret-gemini-key",
                "gemini-2.5-flash",
                baseUrl + "/v1beta/models",
                HttpClient.newHttpClient(),
                true
        );

        ImageModerationResult result = service.checkImages(
                List.of(baseUrl + "/media/nsfw-photo.png"),
                "Check ảnh"
        );

        assertThat(receivedApiKey.get()).isEqualTo("secret-gemini-key");
        assertThat(result.violated()).isTrue();
        assertThat(result.category()).isEqualTo(ImageModerationResult.CATEGORY_SENSITIVE_NSFW);
        assertThat(result.flaggedImageKey()).isEqualTo("nsfw-photo.png");
        assertThat(result.reason()).contains("18+");
    }

    @Test
    @DisplayName("4. Google chặn cứng PROHIBITED_CONTENT -> vẫn bắt được là ảnh vi phạm nghiêm trọng")
    void geminiHardBlockedBySafetyFilter_treatedAsViolated() throws Exception {
        GeminiImageModerationServiceImpl service = new GeminiImageModerationServiceImpl(true, "test-key", "gemini-2.5-flash");
        String blockedPayload = """
                {
                  "promptFeedback": {
                    "blockReason": "PROHIBITED_CONTENT"
                  }
                }
                """;
        ImageModerationResult result = service.parseGeminiResponse(
                blockedPayload,
                List.of(new GeminiImageModerationServiceImpl.PreparedImage("image/jpeg", "dGVzdA==", "extreme.jpg"))
        );

        assertThat(result.violated()).isTrue();
        assertThat(result.flaggedImageKey()).isEqualTo("extreme.jpg");
    }

    @Test
    @DisplayName("5. Post-First: văn bản sạch nhưng ảnh bạo lực -> tự động ẩn bài, gửi thông báo tác giả & tạo Report cho Admin")
    void handlePostCreated_cleanTextViolatingImage_autoHidesPostAndCreatesSystemReport() {
        Post post = Post.builder()
                .id(101L)
                .content("Hôm nay trời đẹp quá")
                .status(PostStatus.ACTIVE)
                .build();
        post.addMedia(PostMedia.builder().url("https://pub-xxx.r2.dev/posts/gore-scene.jpg").mediaType("IMAGE").sortOrder((short) 0).build());

        when(postRepository.findById(101L)).thenReturn(Optional.of(post));
        when(contentModerationService.evaluateContent(post.getContent())).thenReturn(
                ModerationResult.builder().score(0.05).detectedKeywords(List.of()).flaggedReason("NO_PROFANITY_DETECTED").autoHide(false).requiresReview(false).build()
        );
        when(reportRepository.existsByPostIdAndStatusAndDetectedKeywords(101L, ReportStatus.DISMISSED, "[Ảnh vi phạm] gore-scene.jpg"))
                .thenReturn(false);
        when(imageModerationService.checkImages(List.of("https://pub-xxx.r2.dev/posts/gore-scene.jpg"), post.getContent()))
                .thenReturn(new ImageModerationResult(
                        true,
                        ImageModerationResult.CATEGORY_VIOLENCE_GORE,
                        "Hình ảnh chứa cảnh máu me bạo lực",
                        "gore-scene.jpg"
                ));
        when(reportRepository.findFirstByPostIdAndReporterIsNullAndStatus(101L, ReportStatus.PENDING))
                .thenReturn(Optional.empty());
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(555L);
            return r;
        });

        listener.handlePostCreated(new PostCreatedModerationEvent(101L, post.getContent(), 9L));

        assertThat(post.getStatus()).isEqualTo(PostStatus.HIDDEN);
        verify(postRepository).save(post);
        verify(notificationService).sendContentModeratedNotification(post);

        ArgumentCaptor<Report> reportCaptor = ArgumentCaptor.forClass(Report.class);
        verify(reportRepository).save(reportCaptor.capture());
        Report savedReport = reportCaptor.getValue();
        assertThat(savedReport.getAutoModerated()).isTrue();
        assertThat(savedReport.getDetectedKeywords()).isEqualTo("[Ảnh vi phạm] gore-scene.jpg");
        assertThat(savedReport.getAiFlaggedReason()).contains("bạo lực");

        verify(messagingTemplate).convertAndSend(eq(ReportModerationListener.ADMIN_MODERATION_TOPIC), any(Object.class));
    }

    @Test
    @DisplayName("6. Ảnh đã được Admin bỏ qua (DISMISSED) trước đó -> không gọi lại Gemini khi sửa caption")
    void handlePostCreated_imageAlreadyDismissedByAdmin_skipsGeminiCheck() {
        Post post = Post.builder()
                .id(202L)
                .content("Cập nhật lại caption lễ tốt nghiệp")
                .status(PostStatus.ACTIVE)
                .build();
        post.addMedia(PostMedia.builder().url("https://pub-xxx.r2.dev/posts/graduation.jpg").mediaType("IMAGE").sortOrder((short) 0).build());

        when(postRepository.findById(202L)).thenReturn(Optional.of(post));
        when(contentModerationService.evaluateContent(post.getContent())).thenReturn(
                ModerationResult.builder().score(0.05).detectedKeywords(List.of()).flaggedReason("NO_PROFANITY_DETECTED").autoHide(false).requiresReview(false).build()
        );
        when(reportRepository.existsByPostIdAndStatusAndDetectedKeywords(202L, ReportStatus.DISMISSED, "[Ảnh vi phạm] graduation.jpg"))
                .thenReturn(true);

        listener.handlePostCreated(new PostCreatedModerationEvent(202L, post.getContent(), 9L));

        verify(imageModerationService, never()).checkImages(any(), any());
        assertThat(post.getStatus()).isEqualTo(PostStatus.ACTIVE);
        verify(reportRepository, never()).save(any());
    }

    private static byte[] createSamplePng(int width, int height) throws Exception {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setColor(new Color(220, 80, 60));
            g.fillRect(0, 0, width, height);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }
}

