package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.PostAiStudioRequest;
import com.alumnect.alumnect_backend.dto.response.post.PostAiStudioResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.gemini.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Cài đặt AI Studio [B1]: MỘT request Gemini 2.5 Flash trả đồng thời loại bài + nội dung + dữ liệu form + cấu hình
 * Poster. Kết quả (từ Gemini hay từ Template cục bộ) đều đi qua cùng bước chuẩn hóa để đảm bảo giao diện luôn nhận
 * được dữ liệu hợp lệ: loại bài/cảnh vật/bảng màu thuộc danh mục cho phép, tiêu đề Poster ≤ 45 ký tự, tối đa 3 ý nổi
 * bật, email hợp lệ, lương min ≤ max, thời gian sự kiện chuyển về ISO-8601 UTC và nằm trong tương lai.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostAiStudioServiceImpl implements PostAiStudioService {

    static final Set<String> TYPES = Set.of("recruitment", "event", "achievement", "normal");
    static final Set<String> SCENES = Set.of("TECH_CODE_WORKSPACE", "AI_CLOUD_SERVER", "FINANCE_BANKING_TOWER",
            "CREATIVE_DESIGN_STUDIO", "EVENT_STAGE_SPOTLIGHT", "TROPHY_ACHIEVEMENT_GOLD", "STARTUP_ROCKET_LAUNCH",
            "COMMUNITY_NETWORK_GLOBE");
    static final Set<String> PALETTES = Set.of("FPT_SIGNATURE", "CYBER_INDIGO", "EMERALD_FINANCE", "ROYAL_GOLD", "CRIMSON_EVENT");

    private static final int HEADLINE_MAX = 45;
    private static final int CONTENT_MAX = 5000;
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    private static final String SYSTEM_INSTRUCTION = """
            Bạn là "AlumNect AI Studio" - trợ lý soạn bài đăng và thiết kế poster cho mạng xã hội cựu sinh viên/sinh viên \
            Đại học FPT. Từ MỘT câu ý tưởng ngắn của người dùng, hãy trả về DUY NHẤT một đối tượng JSON hợp lệ (không giải thích).

            QUY TẮC:
            1. detectedType: chọn đúng một trong "recruitment" (tuyển dụng), "event" (sự kiện/workshop/họp mặt), \
            "achievement" (vinh danh thành tựu/giải thưởng), "normal" (bài thảo luận/chia sẻ chung).
            2. polishedContent: bài đăng tiếng Việt hoàn chỉnh, văn phong thân thiện chuyên nghiệp, có emoji vừa phải, \
            xuống dòng rõ ràng theo mục, kết bằng lời kêu gọi hành động và 2-3 hashtag. Tối đa 1800 ký tự. \
            TUYỆT ĐỐI KHÔNG bịa thông tin cụ thể không có trong ý tưởng (lương, phúc lợi, email, số lượng, địa điểm, ngày giờ). \
            Thiếu thông tin thì viết chung chung hoặc bỏ qua mục đó.
            3. jobData: chỉ điền khi detectedType = "recruitment", ngược lại là null. title = chức danh; company; location; \
            salaryMin/salaryMax là SỐ NGUYÊN theo VNĐ/tháng (VD "18-30 triệu" => 18000000 và 30000000; không nói lương => null); \
            contactEmail, applyUrl lấy đúng từ ý tưởng (không có => chuỗi rỗng).
            4. eventData: chỉ điền khi detectedType = "event", ngược lại là null. startTime/endTime là chuỗi ISO-8601 CÓ múi giờ \
            +07:00 (VD "2026-11-20T19:30:00+07:00"), suy từ ngày hiện tại được cung cấp; ngày không ghi năm thì lấy lần xuất hiện \
            gần nhất trong tương lai; không rõ => null. capacity là số nguyên hoặc null.
            5. posterSpec (nội dung IN TRÊN POSTER, tiếng Việt có dấu, KHÔNG dùng emoji):
               - illustrationScene: một trong TECH_CODE_WORKSPACE (lập trình/phần mềm), AI_CLOUD_SERVER (AI/dữ liệu/cloud), \
            FINANCE_BANKING_TOWER (ngân hàng/tài chính/kế toán), CREATIVE_DESIGN_STUDIO (thiết kế/marketing/sáng tạo), \
            EVENT_STAGE_SPOTLIGHT (sự kiện/workshop/họp mặt), TROPHY_ACHIEVEMENT_GOLD (vinh danh/giải thưởng), \
            STARTUP_ROCKET_LAUNCH (khởi nghiệp), COMMUNITY_NETWORK_GLOBE (cộng đồng/thảo luận chung).
               - colorPalette: một trong FPT_SIGNATURE, CYBER_INDIGO, EMERALD_FINANCE, ROYAL_GOLD, CRIMSON_EVENT.
               - badgeText: nhãn ngắn IN HOA trên đỉnh poster (VD "ĐANG TUYỂN DỤNG", "SỰ KIỆN NỔI BẬT", "VINH DANH THÀNH TỰU").
               - headline: tiêu đề lớn IN HOA, tối đa 45 ký tự.
               - subheadline: dòng phụ (tên công ty/đơn vị tổ chức • địa điểm ngắn).
               - highlightPill: thông tin quan trọng nhất (mức lương dạng "18.000.000 - 30.000.000 VNĐ" hoặc thời gian sự kiện).
               - locationText: địa điểm ngắn gọn (rỗng nếu không có).
               - bulletPoints: đúng 3 ý nổi bật, mỗi ý tối đa 55 ký tự, chỉ dựa trên thông tin có thật trong ý tưởng.

            ĐỊNH DẠNG JSON:
            {"detectedType":"","polishedContent":"","jobData":null,"eventData":null,\
            "posterSpec":{"illustrationScene":"","colorPalette":"","badgeText":"","headline":"","subheadline":"",\
            "highlightPill":"","locationText":"","bulletPoints":["","",""]}}
            Với jobData: {"title":"","company":"","location":"","salaryMin":null,"salaryMax":null,"contactEmail":"","applyUrl":""}. \
            Với eventData: {"title":"","location":"","startTime":null,"endTime":null,"capacity":null}.
            """;

    private final GeminiClient geminiClient;
    private final UserRepository userRepository;

    @Override
    public PostAiStudioResponse generate(String email, PostAiStudioRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase(Locale.ROOT) : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được dùng AI Studio");
        }

        String prompt = request.getPrompt().trim();
        ZonedDateTime now = ZonedDateTime.now(PostAiStudioLocalTemplate.VN_ZONE);

        String userPrompt = "Hôm nay là " + now.toLocalDate() + " (múi giờ Asia/Ho_Chi_Minh, +07:00)."
                + (request.getPreferredType() == null || request.getPreferredType().isBlank() ? ""
                : "\nLoại bài người dùng đang chọn trên giao diện (chỉ tham khảo): " + request.getPreferredType().trim() + ".")
                + "\nÝ tưởng của người dùng:\n\"\"\"\n" + prompt + "\n\"\"\"";

        Optional<PostAiStudioModelOutput> ai = geminiClient.generateStructured(SYSTEM_INSTRUCTION, userPrompt, PostAiStudioModelOutput.class);
        boolean fromGemini = ai.isPresent() && ai.get().getPolishedContent() != null && !ai.get().getPolishedContent().isBlank();

        PostAiStudioModelOutput raw = fromGemini
                ? ai.get()
                : PostAiStudioLocalTemplate.build(prompt, request.getPreferredType(), now);

        PostAiStudioResponse response = normalize(raw, prompt, request.getPreferredType(), now);
        response.setSource(fromGemini ? "GEMINI" : "LOCAL_FALLBACK");
        log.info("AI Studio [B1]: type={}, scene={}, source={}", response.getDetectedType(),
                response.getPosterSpec().getIllustrationScene(), response.getSource());
        return response;
    }

    // ------------------------------------------------------------------ chuẩn hóa

    PostAiStudioResponse normalize(PostAiStudioModelOutput raw, String prompt, String preferredType, ZonedDateTime now) {
        String type = raw.getDetectedType() == null ? "" : raw.getDetectedType().trim().toLowerCase(Locale.ROOT);
        if (!TYPES.contains(type)) {
            type = PostAiStudioLocalTemplate.detectType(VietnameseStringUtils.removeAccents(prompt), preferredType);
        }
        // Nếu model nói "recruitment/event" nhưng không có khối dữ liệu tương ứng thì hạ về "normal" để form không trống.
        if (type.equals("recruitment") && raw.getJobData() == null) {
            type = "normal";
        }
        if (type.equals("event") && raw.getEventData() == null) {
            type = "normal";
        }

        String content = clean(raw.getPolishedContent());
        if (content == null) {
            content = prompt;
        }
        if (content.length() > CONTENT_MAX) {
            content = content.substring(0, CONTENT_MAX);
        }

        PostAiStudioResponse.PosterSpec poster = normalizePoster(raw.getPosterSpec(), type, prompt);

        return PostAiStudioResponse.builder()
                .detectedType(type)
                .polishedContent(content)
                .jobData(type.equals("recruitment") ? normalizeJob(raw.getJobData()) : null)
                .eventData(type.equals("event") ? normalizeEvent(raw.getEventData(), now) : null)
                .posterSpec(poster)
                .build();
    }

    private PostAiStudioResponse.JobData normalizeJob(PostAiStudioModelOutput.Job job) {
        Long min = positiveOrNull(job.getSalaryMin());
        Long max = positiveOrNull(job.getSalaryMax());
        if (min != null && max != null && min > max) {
            Long tmp = min;
            min = max;
            max = tmp;
        }
        String contactEmail = clean(job.getContactEmail());
        if (contactEmail != null && !EMAIL.matcher(contactEmail).matches()) {
            contactEmail = null;
        }
        String applyUrl = clean(job.getApplyUrl());
        if (applyUrl != null && !applyUrl.toLowerCase(Locale.ROOT).startsWith("http")) {
            applyUrl = null;
        }
        return PostAiStudioResponse.JobData.builder()
                .title(truncate(clean(job.getTitle()), 120))
                .company(truncate(clean(job.getCompany()), 150))
                .location(truncate(clean(job.getLocation()), 120))
                .salaryMin(min)
                .salaryMax(max)
                .contactEmail(contactEmail)
                .applyUrl(applyUrl)
                .build();
    }

    private PostAiStudioResponse.EventData normalizeEvent(PostAiStudioModelOutput.Event event, ZonedDateTime now) {
        Instant start = parseInstant(event.getStartTime());
        Instant end = parseInstant(event.getEndTime());
        Instant nowInstant = now.toInstant();
        // Model đôi khi chọn nhầm năm đã qua cho ngày không ghi năm -> đẩy sang năm sau nếu vẫn hợp lý (< 11 tháng trước).
        if (start != null && start.isBefore(nowInstant) && start.isAfter(nowInstant.minusSeconds(60L * 60 * 24 * 330))) {
            long shift = start.atZone(PostAiStudioLocalTemplate.VN_ZONE).plusYears(1).toInstant().getEpochSecond() - start.getEpochSecond();
            start = start.plusSeconds(shift);
            if (end != null) {
                end = end.plusSeconds(shift);
            }
        }
        if (start != null && start.isBefore(nowInstant)) {
            start = null; // quá khứ xa: để người dùng tự chọn lại, tránh bị Backend từ chối khi đăng
        }
        if (start == null || (end != null && !end.isAfter(start))) {
            end = null;
        }
        Integer capacity = event.getCapacity() != null && event.getCapacity() >= 1 ? event.getCapacity() : null;
        return PostAiStudioResponse.EventData.builder()
                .title(truncate(clean(event.getTitle()), 150))
                .location(truncate(clean(event.getLocation()), 200))
                .startTime(start == null ? null : start.toString())
                .endTime(end == null ? null : end.toString())
                .capacity(capacity)
                .build();
    }

    private PostAiStudioResponse.PosterSpec normalizePoster(PostAiStudioModelOutput.Poster poster, String type, String prompt) {
        PostAiStudioModelOutput.Poster p = poster != null ? poster : new PostAiStudioModelOutput.Poster();
        String norm = VietnameseStringUtils.removeAccents(prompt);

        String scene = p.getIllustrationScene() == null ? "" : p.getIllustrationScene().trim().toUpperCase(Locale.ROOT);
        if (!SCENES.contains(scene)) {
            scene = PostAiStudioLocalTemplate.pickScene(type, norm);
        }
        String palette = p.getColorPalette() == null ? "" : p.getColorPalette().trim().toUpperCase(Locale.ROOT);
        if (!PALETTES.contains(palette)) {
            palette = PostAiStudioLocalTemplate.pickPalette(type, norm, scene);
        }

        String headline = clean(p.getHeadline());
        if (headline == null) {
            headline = prompt;
        }
        headline = cutAtWord(headline.toUpperCase(Locale.ROOT), HEADLINE_MAX);

        List<String> bullets = new ArrayList<>();
        if (p.getBulletPoints() != null) {
            for (String b : p.getBulletPoints()) {
                String c = clean(b);
                if (c != null && bullets.size() < 3) {
                    bullets.add(cutAtWord(c, 60));
                }
            }
        }

        return PostAiStudioResponse.PosterSpec.builder()
                .illustrationScene(scene)
                .colorPalette(palette)
                .badgeText(truncate(defaultIfBlank(clean(p.getBadgeText()), defaultBadge(type)), 32))
                .headline(headline)
                .subheadline(truncate(clean(p.getSubheadline()), 70))
                .highlightPill(truncate(clean(p.getHighlightPill()), 48))
                .locationText(truncate(clean(p.getLocationText()), 60))
                .bulletPoints(bullets)
                .build();
    }

    // ------------------------------------------------------------------ tiện ích

    private static String defaultBadge(String type) {
        return switch (type) {
            case "recruitment" -> "ĐANG TUYỂN DỤNG";
            case "event" -> "SỰ KIỆN NỔI BẬT";
            case "achievement" -> "VINH DANH THÀNH TỰU";
            default -> "CỘNG ĐỒNG ALUMNECT";
        };
    }

    private static Instant parseInstant(String value) {
        String v = clean(value);
        if (v == null) {
            return null;
        }
        try {
            return OffsetDateTime.parse(v).toInstant();
        } catch (RuntimeException ignored) {
            // thử tiếp định dạng không có múi giờ
        }
        try {
            return LocalDateTime.parse(v).atZone(PostAiStudioLocalTemplate.VN_ZONE).toInstant();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static Long positiveOrNull(Long v) {
        return v != null && v > 0 ? v : null;
    }

    /** Cắt khoảng trắng; chuỗi rỗng / "null" chuẩn hóa thành null. */
    private static String clean(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() || t.equalsIgnoreCase("null") ? null : t;
    }

    private static String defaultIfBlank(String s, String fallback) {
        return s == null ? fallback : s;
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max).trim();
    }

    /** Cắt ở ranh giới từ gần nhất để tiêu đề Poster không bị đứt giữa chữ. */
    private static String cutAtWord(String s, int max) {
        String t = s.trim().replaceAll("\\s+", " ");
        if (t.length() <= max) {
            return t;
        }
        int cut = t.lastIndexOf(' ', max);
        return t.substring(0, cut > max / 2 ? cut : max).trim();
    }
}
