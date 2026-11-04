package com.alumnect.alumnect_backend.service.moderation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Triển khai kiểm duyệt hình ảnh bài viết bằng Google Gemini Vision API (gemini-2.5-flash).
 * <p>
 * Quy trình tối ưu tốc độ trong luồng nền (@Async):
 * 1. Tải ảnh từ Cloudflare R2 vào bộ nhớ RAM (giới hạn dung lượng an toàn chống OOM/SSRF).
 * 2. Thu nhỏ ảnh xuống thumbnail tối đa 512px (JPEG ~20-40KB) ngay trong RAM để gửi đi dưới 1 giây.
 * 3. Gộp toàn bộ ảnh của bài viết vào 1 request Gemini duy nhất với kết quả JSON nhị phân (violated: true/false).
 */
@Service
@Slf4j
public class GeminiImageModerationServiceImpl implements ImageModerationService {

    private static final String DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
    private static final int MAX_IMAGES_PER_POST = 6;
    private static final int MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
    private static final int MAX_RAW_FALLBACK_BYTES = 4 * 1024 * 1024; // 4 MB cho định dạng WebP/HEIC không qua ImageIO
    private static final int THUMBNAIL_MAX_DIMENSION = 512;
    private static final float JPEG_QUALITY = 0.75f;
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration IMAGE_READ_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration GEMINI_TIMEOUT = Duration.ofSeconds(15);

    private static final Set<String> SUPPORTED_FALLBACK_MIMES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"
    );

    private static final Set<String> HARD_BLOCK_REASONS = Set.of(
            "SAFETY", "PROHIBITED_CONTENT", "IMAGE_SAFETY", "BLOCKLIST"
    );

    private static final String SYSTEM_INSTRUCTION = """
            Bạn là hệ thống kiểm duyệt hình ảnh tự động cho mạng xã hội cựu sinh viên đại học AlumNect.
            Nhiệm vụ của bạn là kiểm tra nhị phân (vi phạm hoặc an toàn) xem bất kỳ hình ảnh nào đính kèm có vi phạm nghiêm trọng tiêu chuẩn cộng đồng hay không.

            CHỈ đánh dấu violated = true khi hình ảnh thuộc một trong hai nhóm sau:
            1. SENSITIVE_NSFW: Ảnh khỏa thân, lộ bộ phận nhạy cảm, hành vi tình dục/khiêu dâm (18+/NSFW), trang phục/tư thế khiêu gợi phản cảm, hoặc hình vẽ/meme đồi trụy.
            2. VIOLENCE_GORE: Cảnh bạo lực đẫm máu, máu me, vết thương hở kinh dị (gore), tra tấn/đánh đập tàn bạo, tự làm hại bản thân (self-harm), tử thi, hoặc sử dụng vũ khí đe dọa tính mạng.

            Đánh dấu violated = false và category = "SAFE" đối với mọi hình ảnh sinh hoạt bình thường:
            - Ảnh tốt nghiệp, sự kiện trường học, hội thảo, công sở, thể thao, du lịch/bãi biển lành mạnh, ẩm thực, tài liệu học tập, ảnh chụp màn hình công việc/lập trình.

            Nếu violated = true, hãy trả về reason ngắn gọn (1 câu tiếng Việt lịch sự, rõ ràng) và violatedImageIndex (số thứ tự ảnh vi phạm, bắt đầu từ 1).
            Nếu violated = false, trả về category = "SAFE", reason = "", violatedImageIndex = 0.
            """;

    private final boolean enabled;
    private final String apiKey;
    private final String model;
    private final String geminiBaseUrl;
    private final HttpClient httpClient;
    private final boolean allowLocalUrls;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicBoolean missingKeyLogged = new AtomicBoolean(false);

    @Autowired
    public GeminiImageModerationServiceImpl(
            @Value("${app.moderation.gemini.enabled:true}") boolean enabled,
            @Value("${app.moderation.gemini.api-key:}") String apiKey,
            @Value("${app.moderation.gemini.model:gemini-2.5-flash}") String model
    ) {
        this(
                enabled,
                apiKey,
                model,
                DEFAULT_GEMINI_BASE_URL,
                HttpClient.newBuilder()
                        .connectTimeout(CONNECT_TIMEOUT)
                        .followRedirects(HttpClient.Redirect.NEVER)
                        .build(),
                false
        );
    }

    /** Constructor phục vụ kiểm thử đơn vị (Unit Test) với HttpClient / local server tùy chỉnh. */
    GeminiImageModerationServiceImpl(
            boolean enabled,
            String apiKey,
            String model,
            String geminiBaseUrl,
            HttpClient httpClient,
            boolean allowLocalUrls
    ) {
        this.enabled = enabled;
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model == null || model.isBlank()) ? "gemini-2.5-flash" : model.trim();
        this.geminiBaseUrl = geminiBaseUrl.endsWith("/")
                ? geminiBaseUrl.substring(0, geminiBaseUrl.length() - 1)
                : geminiBaseUrl;
        this.httpClient = httpClient;
        this.allowLocalUrls = allowLocalUrls;
    }

    @Override
    public ImageModerationResult checkImages(List<String> imageUrls, String postContextText) {
        if (!enabled || imageUrls == null || imageUrls.isEmpty()) {
            return ImageModerationResult.safe();
        }
        if (apiKey.isEmpty()) {
            if (missingKeyLogged.compareAndSet(false, true)) {
                log.warn("Chưa cấu hình GEMINI_API_KEY — tạm bỏ qua quét ảnh AI, hệ thống vẫn kiểm duyệt văn bản bình thường.");
            }
            return ImageModerationResult.safe();
        }

        List<PreparedImage> preparedImages = new ArrayList<>();
        for (String rawUrl : imageUrls) {
            if (preparedImages.size() >= MAX_IMAGES_PER_POST) {
                break;
            }
            if (rawUrl == null || rawUrl.isBlank()) {
                continue;
            }
            PreparedImage prepared = downloadAndCompress(rawUrl.trim());
            if (prepared != null) {
                preparedImages.add(prepared);
            }
        }

        if (preparedImages.isEmpty()) {
            return ImageModerationResult.safe();
        }

        try {
            String requestJson = buildGeminiRequestPayload(preparedImages, postContextText);
            URI endpoint = URI.create(geminiBaseUrl + "/" + model + ":generateContent");

            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(GEMINI_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Gemini API trả về mã lỗi HTTP {} khi kiểm duyệt ảnh: {}",
                        response.statusCode(), truncate(response.body(), 200));
                return ImageModerationResult.safe();
            }

            return parseGeminiResponse(response.body(), preparedImages);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("Luồng kiểm duyệt ảnh AI bị ngắt: {}", ex.getMessage());
            return ImageModerationResult.safe();
        } catch (Exception ex) {
            log.warn("Không thể gọi Gemini AI kiểm duyệt ảnh (bỏ qua an toàn): {}", ex.getMessage());
            return ImageModerationResult.safe();
        }
    }

    private PreparedImage downloadAndCompress(String imageUrl) {
        try {
            URI currentUri = URI.create(imageUrl);
            HttpResponse<InputStream> response = null;

            // Hỗ trợ tối đa 2 lần redirect nhưng kiểm tra chống SSRF ở từng bước
            for (int redirectCount = 0; redirectCount <= 2; redirectCount++) {
                if (!isSafeImageUri(currentUri)) {
                    log.warn("Từ chối tải URL ảnh không an toàn khi kiểm duyệt: {}", imageUrl);
                    return null;
                }
                HttpRequest imgReq = HttpRequest.newBuilder(currentUri)
                        .timeout(IMAGE_READ_TIMEOUT)
                        .header("User-Agent", "AlumNect-ModerationBot/1.0")
                        .GET()
                        .build();
                response = httpClient.send(imgReq, HttpResponse.BodyHandlers.ofInputStream());
                int status = response.statusCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    closeQuietly(response.body());
                    String location = response.headers().firstValue("Location").orElse(null);
                    if (location == null || location.isBlank()) {
                        return null;
                    }
                    currentUri = currentUri.resolve(location);
                    continue;
                }
                break;
            }

            if (response == null || response.statusCode() != 200) {
                if (response != null) {
                    closeQuietly(response.body());
                }
                log.debug("Không tải được ảnh kiểm duyệt (HTTP {}): {}",
                        response != null ? response.statusCode() : -1, imageUrl);
                return null;
            }

            byte[] rawBytes;
            try (InputStream in = response.body()) {
                rawBytes = in.readNBytes(MAX_DOWNLOAD_BYTES + 1);
            }
            if (rawBytes.length == 0 || rawBytes.length > MAX_DOWNLOAD_BYTES) {
                log.warn("Bỏ qua ảnh có kích thước không hợp lệ ({} bytes): {}", rawBytes.length, imageUrl);
                return null;
            }

            String contentType = response.headers().firstValue("Content-Type")
                    .map(ct -> ct.split(";")[0].trim().toLowerCase(Locale.ROOT))
                    .orElseGet(() -> guessMimeFromUrl(imageUrl));

            String imageKey = extractImageKey(imageUrl);
            return compressToThumbnail(rawBytes, contentType, imageKey);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception ex) {
            log.debug("Lỗi khi tải/nén ảnh kiểm duyệt {}: {}", imageUrl, ex.getMessage());
            return null;
        }
    }

    /** Thu nhỏ ảnh trong bộ nhớ RAM xuống <= 512px JPEG để tối ưu băng thông gửi tới Gemini. */
    PreparedImage compressToThumbnail(byte[] rawBytes, String contentType, String imageKey) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(rawBytes));
            if (original != null) {
                int origW = original.getWidth();
                int origH = original.getHeight();
                if (origW <= 0 || origH <= 0) {
                    return null;
                }
                int targetW = origW;
                int targetH = origH;
                if (origW > THUMBNAIL_MAX_DIMENSION || origH > THUMBNAIL_MAX_DIMENSION) {
                    double scale = (double) THUMBNAIL_MAX_DIMENSION / Math.max(origW, origH);
                    targetW = Math.max(1, (int) Math.round(origW * scale));
                    targetH = Math.max(1, (int) Math.round(origH * scale));
                }

                BufferedImage rgbImage = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = rgbImage.createGraphics();
                try {
                    g2d.setColor(Color.WHITE);
                    g2d.fillRect(0, 0, targetW, targetH);
                    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    g2d.drawImage(original, 0, 0, targetW, targetH, null);
                } finally {
                    g2d.dispose();
                }

                byte[] jpegBytes = encodeJpeg(rgbImage);
                return new PreparedImage("image/jpeg", Base64.getEncoder().encodeToString(jpegBytes), imageKey);
            }
        } catch (Exception ex) {
            log.debug("ImageIO không giải mã được ảnh {}, chuyển sang gửi trực tiếp nếu hợp lệ: {}", imageKey, ex.getMessage());
        }

        // Fallback cho định dạng hiện đại như WebP/HEIC mà JDK ImageIO mặc định chưa đọc được
        String normalizedMime = (contentType == null || contentType.isBlank()) ? "image/webp" : contentType;
        if (rawBytes.length <= MAX_RAW_FALLBACK_BYTES && SUPPORTED_FALLBACK_MIMES.contains(normalizedMime)) {
            return new PreparedImage(normalizedMime, Base64.getEncoder().encodeToString(rawBytes), imageKey);
        }
        return null;
    }

    private static byte[] encodeJpeg(BufferedImage image) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream(24 * 1024);
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            ImageIO.write(image, "jpg", out);
            return out.toByteArray();
        }
        ImageWriter writer = writers.next();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(JPEG_QUALITY);
            }
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }

    private String buildGeminiRequestPayload(List<PreparedImage> images, String postContextText) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();

        // System instruction
        ObjectNode sysInstruction = root.putObject("systemInstruction");
        sysInstruction.putArray("parts").addObject().put("text", SYSTEM_INSTRUCTION);

        // User contents (ngữ cảnh văn bản + danh sách thumbnail ảnh)
        ArrayNode contents = root.putArray("contents");
        ObjectNode userContent = contents.addObject();
        userContent.put("role", "user");
        ArrayNode parts = userContent.putArray("parts");

        String safeContext = (postContextText == null || postContextText.isBlank())
                ? "(Không có văn bản đi kèm)"
                : truncate(postContextText.trim(), 500);
        parts.addObject().put("text", "Ngữ cảnh văn bản bài viết: " + safeContext
                + "\nHãy kiểm tra " + images.size() + " hình ảnh đính kèm dưới đây:");

        for (int i = 0; i < images.size(); i++) {
            PreparedImage img = images.get(i);
            parts.addObject().put("text", "Ảnh #" + (i + 1) + " (" + img.key() + "):");
            ObjectNode inlineData = parts.addObject().putObject("inlineData");
            inlineData.put("mimeType", img.mimeType());
            inlineData.put("data", img.base64Data());
        }

        // Tắt bộ chặn mặc định để mô hình trả về kết quả phân loại JSON chính xác;
        // nếu mức độ cực đoan bị Google chặn cứng (PROHIBITED_CONTENT), parseGeminiResponse vẫn bắt được.
        ArrayNode safetySettings = root.putArray("safetySettings");
        for (String harmCategory : List.of(
                "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "HARM_CATEGORY_DANGEROUS_CONTENT",
                "HARM_CATEGORY_HARASSMENT",
                "HARM_CATEGORY_HATE_SPEECH"
        )) {
            ObjectNode setting = safetySettings.addObject();
            setting.put("category", harmCategory);
            setting.put("threshold", "BLOCK_NONE");
        }

        // Ép cấu trúc JSON đầu ra nhị phân + tắt thinking cho gemini-2.5 để phản hồi < 1s
        ObjectNode genConfig = root.putObject("generationConfig");
        genConfig.put("temperature", 0.0);
        genConfig.put("responseMimeType", "application/json");
        if (model.startsWith("gemini-2.5")) {
            genConfig.putObject("thinkingConfig").put("thinkingBudget", 0);
        }

        ObjectNode schema = genConfig.putObject("responseSchema");
        schema.put("type", "OBJECT");
        ObjectNode props = schema.putObject("properties");
        props.putObject("violated").put("type", "BOOLEAN");
        ObjectNode catProp = props.putObject("category");
        catProp.put("type", "STRING");
        ArrayNode catEnum = catProp.putArray("enum");
        catEnum.add(ImageModerationResult.CATEGORY_SAFE);
        catEnum.add(ImageModerationResult.CATEGORY_SENSITIVE_NSFW);
        catEnum.add(ImageModerationResult.CATEGORY_VIOLENCE_GORE);
        props.putObject("reason").put("type", "STRING");
        props.putObject("violatedImageIndex").put("type", "INTEGER");

        ArrayNode required = schema.putArray("required");
        required.add("violated");
        required.add("category");
        required.add("reason");

        return objectMapper.writeValueAsString(root);
    }

    ImageModerationResult parseGeminiResponse(String responseBody, List<PreparedImage> images) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);

        // Trường hợp ảnh quá nhạy cảm/bạo lực khiến bộ lọc an toàn gốc của Google chặn cứng ngay từ đầu
        String blockReason = root.path("promptFeedback").path("blockReason").asText("");
        if (!blockReason.isEmpty() && HARD_BLOCK_REASONS.contains(blockReason.toUpperCase(Locale.ROOT))) {
            return new ImageModerationResult(
                    true,
                    ImageModerationResult.CATEGORY_SENSITIVE_NSFW,
                    "Hình ảnh bị chặn do vi phạm nghiêm trọng tiêu chuẩn an toàn (nhạy cảm 18+ hoặc bạo lực)",
                    images.get(0).key()
            );
        }

        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return ImageModerationResult.safe();
        }

        JsonNode firstCandidate = candidates.get(0);
        String finishReason = firstCandidate.path("finishReason").asText("");
        if (!finishReason.isEmpty() && HARD_BLOCK_REASONS.contains(finishReason.toUpperCase(Locale.ROOT))) {
            return new ImageModerationResult(
                    true,
                    ImageModerationResult.CATEGORY_SENSITIVE_NSFW,
                    "Hình ảnh vi phạm nghiêm trọng tiêu chuẩn an toàn cộng đồng",
                    images.get(0).key()
            );
        }

        JsonNode parts = firstCandidate.path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            return ImageModerationResult.safe();
        }

        String rawText = parts.get(0).path("text").asText("").trim();
        if (rawText.isEmpty()) {
            return ImageModerationResult.safe();
        }
        String cleanJson = stripMarkdownFences(rawText);
        JsonNode verdict = objectMapper.readTree(cleanJson);

        boolean violated = verdict.path("violated").asBoolean(false);
        if (!violated) {
            return ImageModerationResult.safe();
        }

        String category = verdict.path("category").asText(ImageModerationResult.CATEGORY_SENSITIVE_NSFW);
        if (!ImageModerationResult.CATEGORY_SENSITIVE_NSFW.equals(category)
                && !ImageModerationResult.CATEGORY_VIOLENCE_GORE.equals(category)) {
            category = ImageModerationResult.CATEGORY_SENSITIVE_NSFW;
        }

        String defaultReason = ImageModerationResult.CATEGORY_VIOLENCE_GORE.equals(category)
                ? "Hình ảnh chứa nội dung bạo lực hoặc máu me"
                : "Hình ảnh chứa nội dung nhạy cảm (18+) không phù hợp";
        String reason = verdict.path("reason").asText("").trim();
        if (reason.isEmpty()) {
            reason = defaultReason;
        }

        int idx = verdict.path("violatedImageIndex").asInt(1);
        PreparedImage flaggedImg = (idx >= 1 && idx <= images.size()) ? images.get(idx - 1) : images.get(0);

        return new ImageModerationResult(true, category, truncate(reason, 180), flaggedImg.key());
    }

    private boolean isSafeImageUri(URI uri) {
        if (uri == null || uri.getScheme() == null || uri.getHost() == null) {
            return false;
        }
        String scheme = uri.getScheme().toLowerCase(Locale.ROOT);
        if (!"https".equals(scheme) && !"http".equals(scheme)) {
            return false;
        }
        if (allowLocalUrls) {
            return true;
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if ("localhost".equals(host) || host.endsWith(".local") || host.endsWith(".internal")) {
            return false;
        }
        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress addr : addresses) {
                if (addr.isLoopbackAddress()
                        || addr.isAnyLocalAddress()
                        || addr.isSiteLocalAddress()
                        || addr.isLinkLocalAddress()
                        || addr.isMulticastAddress()) {
                    return false;
                }
            }
            return addresses.length > 0;
        } catch (Exception ex) {
            return false;
        }
    }

    static String extractImageKey(String url) {
        try {
            String path = URI.create(url).getPath();
            if (path != null && !path.isBlank()) {
                int slash = path.lastIndexOf('/');
                String fileName = slash >= 0 ? path.substring(slash + 1) : path;
                if (!fileName.isBlank()) {
                    return truncate(fileName.replace(",", "_"), 80);
                }
            }
        } catch (Exception ignored) {
        }
        return "image_" + Integer.toHexString(url.hashCode());
    }

    private static String guessMimeFromUrl(String url) {
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains(".png")) return "image/png";
        if (lower.contains(".webp")) return "image/webp";
        if (lower.contains(".gif")) return "image/gif";
        if (lower.contains(".heic")) return "image/heic";
        if (lower.contains(".heif")) return "image/heif";
        return "image/jpeg";
    }

    private static String stripMarkdownFences(String text) {
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            int lastFence = text.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                return text.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return text;
    }

    private static String truncate(String str, int maxLen) {
        if (str == null) return "";
        return str.length() <= maxLen ? str : str.substring(0, maxLen) + "...";
    }

    private static void closeQuietly(InputStream in) {
        if (in != null) {
            try {
                in.close();
            } catch (Exception ignored) {
            }
        }
    }

    record PreparedImage(String mimeType, String base64Data, String key) {
    }
}

