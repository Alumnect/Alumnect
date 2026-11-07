package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bộ Template cục bộ của AI Studio [B1] — "bảo hiểm" khi Gemini chậm (&gt;4s), lỗi mạng hoặc chưa cấu hình API key.
 * Dùng luật + biểu thức chính quy để bóc tách loại bài, chức danh, công ty, lương, email, thời gian, địa điểm, sức
 * chứa từ câu ý tưởng và dựng bài viết/Poster bằng mẫu có sẵn; chạy dưới 200ms, không gọi mạng.
 * <p>
 * Trả về cùng cấu trúc {@link PostAiStudioModelOutput} như Gemini nên đi chung đường chuẩn hóa/kiểm tra ở Service.
 */
final class PostAiStudioLocalTemplate {

    static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS;

    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}");
    private static final Pattern URL = Pattern.compile("https?://[^\\s,;]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern SALARY_RANGE = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*(?:-|–|den|toi|~)\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:tr|trieu|m|cu)\\b");
    private static final Pattern SALARY_SINGLE = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:tr|trieu|cu)\\b");
    private static final Pattern JOB_TITLE = Pattern.compile(
            "tuyển(?:\\s+dụng)?\\s+(?:\\d+\\s*)?(?:(?:bạn|em|anh|chị)\\b)?\\s*(.+?)\\s*"
                    + "(?:\\btại\\b|\\bvề\\b|\\bcho\\b|\\bở\\b|\\blàm\\b|\\blương\\b|,|\\.|;|$)", FLAGS);
    private static final Pattern JOB_QTY = Pattern.compile("tuyển(?:\\s+dụng)?\\s+(\\d{1,3})\\b", FLAGS);
    private static final Pattern COMPANY = Pattern.compile(
            "(?:\\b[tT]ại|\\b[vV]ề|\\bcho|\\bat)\\s+((?:[A-ZĐ][\\p{L}0-9&.\\-]*)(?:\\s+[A-ZĐ0-9][\\p{L}0-9&.\\-]*){0,4})");
    private static final Pattern EVENT_TITLE = Pattern.compile(
            "\\b(workshop|hội thảo|talkshow|seminar|meetup|họp mặt|hackathon|minigame|cuộc thi|sự kiện)\\b\\s*(.*?)"
                    + "(?=\\s+(?:vào|lúc|tối|sáng|chiều|ngày|tại|thứ|từ)\\b|,|\\.|;|$)", FLAGS);
    private static final Pattern PLACE = Pattern.compile(
            "\\btại\\s+(.+?)(?=,|\\.|;|\\s+tối đa|\\s+khoảng|\\s+vào lúc|\\s+lúc|$)", FLAGS);
    private static final Pattern TIME = Pattern.compile("(\\d{1,2})\\s*(?:h|gio|:)\\s*(\\d{1,2})?");
    private static final Pattern DATE = Pattern.compile("(?:ngay\\s*)?(\\d{1,2})\\s*/\\s*(\\d{1,2})(?:\\s*/\\s*(\\d{2,4}))?");
    private static final Pattern DATE_WORDS = Pattern.compile("ngay\\s*(\\d{1,2})\\s*thang\\s*(\\d{1,2})(?:\\s*(?:nam)?\\s*(\\d{4}))?");
    private static final Pattern CAPACITY = Pattern.compile(
            "(?:toi da|khoang|~|co)?\\s*(\\d{1,5})\\s*(?:nguoi|ban|slot|cho|suat|thanh vien)");

    private static final String[][] KNOWN_LOCATIONS = {
            {"khu cong nghe cao hoa lac", "Khu Công nghệ cao Hòa Lạc, Hà Nội"},
            {"hoa lac", "Hòa Lạc, Hà Nội"},
            {"ha noi", "Hà Nội"},
            {"ho chi minh", "TP. Hồ Chí Minh"},
            {"tp.hcm", "TP. Hồ Chí Minh"},
            {"tphcm", "TP. Hồ Chí Minh"},
            {"tp hcm", "TP. Hồ Chí Minh"},
            {"sai gon", "TP. Hồ Chí Minh"},
            {"da nang", "Đà Nẵng"},
            {"can tho", "Cần Thơ"},
            {"hai phong", "Hải Phòng"},
            {"quy nhon", "Quy Nhơn"},
            {"remote", "Remote"},
    };

    private static final String[] LOCATION_WORDS_TO_STRIP = {
            "Khu Công nghệ cao", "Hòa Lạc", "Hà Nội", "TP.HCM", "TPHCM", "TP HCM", "TP. Hồ Chí Minh", "Hồ Chí Minh",
            "Sài Gòn", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Quy Nhơn", "Remote",
    };

    private PostAiStudioLocalTemplate() {
    }

    /**
     * Dựng kết quả AI Studio hoàn toàn cục bộ.
     *
     * @param prompt        Câu ý tưởng người dùng nhập
     * @param preferredType Loại bài đang chọn trên giao diện (tùy chọn, dùng khi nội dung không đủ tín hiệu)
     * @param now           Thời điểm hiện tại theo múi giờ Việt Nam (để suy luận năm của ngày không ghi năm)
     */
    static PostAiStudioModelOutput build(String prompt, String preferredType, ZonedDateTime now) {
        String raw = prompt == null ? "" : prompt.trim().replaceAll("\\s+", " ");
        String norm = VietnameseStringUtils.removeAccents(raw);
        String type = detectType(norm, preferredType);

        PostAiStudioModelOutput out = new PostAiStudioModelOutput();
        out.setDetectedType(type);
        String scene = pickScene(type, norm);
        String palette = pickPalette(type, norm, scene);
        PostAiStudioModelOutput.Poster poster = new PostAiStudioModelOutput.Poster();
        poster.setIllustrationScene(scene);
        poster.setColorPalette(palette);
        out.setPosterSpec(poster);

        switch (type) {
            case "recruitment" -> buildRecruitment(out, raw, norm);
            case "event" -> buildEvent(out, raw, norm, now);
            case "achievement" -> buildAchievement(out, raw);
            default -> buildNormal(out, raw);
        }
        return out;
    }

    // ------------------------------------------------------------------ phân loại

    static String detectType(String norm, String preferredType) {
        if (containsAny(norm, "tuyen", "hiring", "ung vien", "gui cv", "vi tri nay", "jd ")) {
            return "recruitment";
        }
        if (containsAny(norm, "workshop", "hoi thao", "talkshow", "seminar", "meetup", "hop mat")) {
            return "event";
        }
        if (containsAny(norm, "dat giai", "vinh danh", "chuc mung", "giai nhat", "giai nhi", "giai ba", "chung chi",
                "hoc bong", "tot nghiep loai", "dat danh hieu", "thanh tich", "huy chuong")) {
            return "achievement";
        }
        if (containsAny(norm, "hackathon", "su kien", "to chuc", "minigame", "cuoc thi", "dang ky tham gia")) {
            return "event";
        }
        if (preferredType != null) {
            String p = preferredType.trim().toLowerCase(Locale.ROOT);
            if (p.equals("recruitment") || p.equals("event") || p.equals("achievement")) {
                return p;
            }
        }
        return "normal";
    }

    static String pickScene(String type, String norm) {
        if (containsAny(norm, "khoi nghiep", "startup")) {
            return "STARTUP_ROCKET_LAUNCH";
        }
        return switch (type) {
            case "event" -> "EVENT_STAGE_SPOTLIGHT";
            case "achievement" -> "TROPHY_ACHIEVEMENT_GOLD";
            case "recruitment" -> {
                if (containsAny(norm, "ngan hang", "tai chinh", "ke toan", "kiem toan", "bank", "finance", "chung khoan",
                        "bao hiem", "tin dung")) {
                    yield "FINANCE_BANKING_TOWER";
                }
                if (containsAny(norm, "design", "thiet ke", "ui/ux", "ui ux", "marketing", "content", "creative", "truyen thong")) {
                    yield "CREATIVE_DESIGN_STUDIO";
                }
                if (containsAny(norm, " ai ", "machine learning", "data", "cloud", "devops", "ml ")) {
                    yield "AI_CLOUD_SERVER";
                }
                yield "TECH_CODE_WORKSPACE";
            }
            default -> {
                if (containsAny(norm, "code", "lap trinh", "java", "python", "developer", "dev ")) {
                    yield "TECH_CODE_WORKSPACE";
                }
                if (containsAny(norm, " ai ", "machine learning", "cloud", "server")) {
                    yield "AI_CLOUD_SERVER";
                }
                if (containsAny(norm, "thiet ke", "design", "sang tao")) {
                    yield "CREATIVE_DESIGN_STUDIO";
                }
                yield "COMMUNITY_NETWORK_GLOBE";
            }
        };
    }

    static String pickPalette(String type, String norm, String scene) {
        return switch (scene) {
            case "FINANCE_BANKING_TOWER" -> "EMERALD_FINANCE";
            case "AI_CLOUD_SERVER" -> "CYBER_INDIGO";
            case "TROPHY_ACHIEVEMENT_GOLD" -> "ROYAL_GOLD";
            case "EVENT_STAGE_SPOTLIGHT" -> "CRIMSON_EVENT";
            case "STARTUP_ROCKET_LAUNCH" -> "CYBER_INDIGO";
            default -> "FPT_SIGNATURE";
        };
    }

    // ------------------------------------------------------------------ từng loại bài

    private static void buildRecruitment(PostAiStudioModelOutput out, String raw, String norm) {
        PostAiStudioModelOutput.Job job = new PostAiStudioModelOutput.Job();

        String title = firstGroup(JOB_TITLE, raw);
        if (title == null || title.isBlank()) {
            title = shorten(raw, 60);
        }
        title = capitalizeFirst(title.trim());
        String company = findCompany(raw);
        String location = findKnownLocation(norm);
        Matcher qtyMatcher = JOB_QTY.matcher(raw);
        Integer qty = qtyMatcher.find() ? Integer.valueOf(qtyMatcher.group(1)) : null;
        long[] salary = findSalary(norm);
        String email = firstMatch(EMAIL, raw);
        String url = firstMatch(URL, raw);

        job.setTitle(title);
        job.setCompany(company);
        job.setLocation(location);
        if (salary != null) {
            job.setSalaryMin(salary[0]);
            job.setSalaryMax(salary[1]);
        }
        job.setContactEmail(email);
        job.setApplyUrl(url);
        out.setJobData(job);

        StringBuilder sb = new StringBuilder();
        String companyLabel = company == null ? "ALUMNECT" : company.toUpperCase(Locale.ROOT);
        sb.append("🚀 [CƠ HỘI NGHỀ NGHIỆP TẠI ").append(companyLabel).append("]\n\n");
        sb.append(company == null ? "Chúng mình" : company).append(" đang tìm kiếm ")
                .append(qty != null ? String.format("%02d ", qty) : "").append(title).append(" gia nhập đội ngũ.\n\n");
        sb.append("📌 Vị trí: ").append(title).append('\n');
        if (company != null) {
            sb.append("🏢 Đơn vị: ").append(company).append('\n');
        }
        if (location != null) {
            sb.append("📍 Địa điểm: ").append(location).append('\n');
        }
        if (salary != null) {
            sb.append("💰 Mức lương: ").append(formatSalaryText(salary[0], salary[1])).append('\n');
        }
        if (email != null) {
            sb.append("📧 Liên hệ: ").append(email).append('\n');
        }
        if (url != null) {
            sb.append("🔗 Ứng tuyển: ").append(url).append('\n');
        }
        sb.append("\n✨ Nếu bạn quan tâm, hãy gửi CV hoặc nhắn trực tiếp để được trao đổi thêm. ")
                .append("Chia sẻ bài viết đến những bạn đang tìm cơ hội nhé!\n\n#TuyenDung #AlumNect #FPTU");
        out.setPolishedContent(sb.toString());

        PostAiStudioModelOutput.Poster p = out.getPosterSpec();
        p.setBadgeText("ĐANG TUYỂN DỤNG");
        p.setHeadline(title.toUpperCase(Locale.ROOT));
        p.setSubheadline(joinNonBlank(" • ", company, location));
        p.setHighlightPill(salary != null ? formatVnd(salary[0]) + " - " + formatVnd(salary[1]) + " VNĐ" : "Lương thỏa thuận");
        p.setLocationText(location);
        List<String> bullets = new ArrayList<>();
        bullets.add(qty != null ? String.format("Tuyển %02d vị trí %s", qty, title) : "Vị trí: " + title);
        if (location != null) {
            bullets.add("Làm việc tại " + location);
        }
        bullets.add(email != null ? "Gửi CV: " + email : "Ứng tuyển trực tiếp qua AlumNect");
        p.setBulletPoints(bullets);
    }

    private static void buildEvent(PostAiStudioModelOutput out, String raw, String norm, ZonedDateTime now) {
        PostAiStudioModelOutput.Event ev = new PostAiStudioModelOutput.Event();

        String title = null;
        Matcher m = EVENT_TITLE.matcher(raw);
        if (m.find()) {
            title = (capitalizeFirst(m.group(1)) + " " + m.group(2)).trim();
        }
        if (title == null || title.isBlank()) {
            title = shorten(raw, 60);
        }
        String place = firstGroup(PLACE, raw);
        Integer capacity = null;
        Matcher cap = CAPACITY.matcher(norm);
        if (cap.find()) {
            capacity = Integer.valueOf(cap.group(1));
        }
        ZonedDateTime start = findDateTime(norm, now);

        ev.setTitle(title);
        ev.setLocation(place);
        ev.setStartTime(start == null ? null : start.toOffsetDateTime().toString());
        ev.setCapacity(capacity);
        out.setEventData(ev);

        StringBuilder sb = new StringBuilder();
        sb.append("📣 [SỰ KIỆN] ").append(title.toUpperCase(Locale.ROOT)).append("\n\n");
        sb.append("AlumNect trân trọng mời bạn tham gia ").append(title).append(".\n\n");
        String when = start == null ? null : formatWhen(start);
        if (when != null) {
            sb.append("🗓 Thời gian: ").append(when).append('\n');
        }
        if (place != null) {
            sb.append("📍 Địa điểm: ").append(place).append('\n');
        }
        if (capacity != null) {
            sb.append("👥 Số lượng: tối đa ").append(capacity).append(" người\n");
        }
        sb.append("\n🎯 Cơ hội giao lưu, học hỏi và kết nối cùng cộng đồng sinh viên - cựu sinh viên FPTU. ")
                .append("Đăng ký sớm để giữ chỗ nhé!\n\n#SuKien #AlumNect #FPTU");
        out.setPolishedContent(sb.toString());

        PostAiStudioModelOutput.Poster p = out.getPosterSpec();
        p.setBadgeText("SỰ KIỆN NỔI BẬT");
        p.setHeadline(title.toUpperCase(Locale.ROOT));
        p.setSubheadline("Cộng đồng AlumNect");
        p.setHighlightPill(when == null ? "Sắp diễn ra" : shortWhen(start));
        p.setLocationText(place);
        List<String> bullets = new ArrayList<>();
        if (when != null) {
            bullets.add("Thời gian: " + when);
        }
        if (place != null) {
            bullets.add("Địa điểm: " + place);
        }
        if (capacity != null) {
            bullets.add("Tối đa " + capacity + " người tham dự");
        }
        if (bullets.isEmpty()) {
            bullets.add("Giao lưu & kết nối cộng đồng AlumNect");
        }
        p.setBulletPoints(bullets);
    }

    private static void buildAchievement(PostAiStudioModelOutput out, String raw) {
        String sentence = capitalizeFirst(raw);
        out.setPolishedContent("🏆 [VINH DANH THÀNH TỰU]\n\n" + sentence
                + (sentence.endsWith(".") || sentence.endsWith("!") ? "" : ".")
                + "\n\n🎉 Chúc mừng thành tích đáng tự hào này! Cảm ơn cộng đồng AlumNect đã luôn đồng hành và cổ vũ."
                + "\n\n#VinhDanh #AlumNect #FPTU");
        PostAiStudioModelOutput.Poster p = out.getPosterSpec();
        p.setBadgeText("VINH DANH THÀNH TỰU");
        p.setHeadline(shorten(raw, 45).toUpperCase(Locale.ROOT));
        p.setSubheadline("Cộng đồng AlumNect");
        p.setHighlightPill("Chúc mừng!");
        p.setBulletPoints(List.of("Ghi nhận nỗ lực và thành tích",
                "Truyền cảm hứng cho cộng đồng", "Cùng AlumNect lan tỏa tự hào FPTU"));
    }

    private static void buildNormal(PostAiStudioModelOutput out, String raw) {
        String sentence = capitalizeFirst(raw);
        out.setPolishedContent("💬 " + sentence + (sentence.endsWith(".") || sentence.endsWith("!") || sentence.endsWith("?") ? "" : ".")
                + "\n\nBạn nghĩ sao? Hãy chia sẻ ý kiến để cùng thảo luận với cộng đồng AlumNect nhé!\n\n#AlumNect #FPTU");
        PostAiStudioModelOutput.Poster p = out.getPosterSpec();
        p.setBadgeText("CỘNG ĐỒNG ALUMNECT");
        p.setHeadline(shorten(raw, 45).toUpperCase(Locale.ROOT));
        p.setSubheadline("Chia sẻ cùng cộng đồng");
        p.setHighlightPill("Thảo luận");
        List<String> bullets = new ArrayList<>();
        for (String part : raw.split("[,.;!?]")) {
            String t = part.trim();
            if (t.length() >= 6 && bullets.size() < 3) {
                bullets.add(shorten(capitalizeFirst(t), 56));
            }
        }
        if (bullets.isEmpty()) {
            bullets.add("Kết nối sinh viên & cựu sinh viên FPTU");
        }
        p.setBulletPoints(bullets);
    }

    // ------------------------------------------------------------------ bóc tách trường dữ liệu

    private static String findCompany(String raw) {
        Matcher m = COMPANY.matcher(raw);
        while (m.find()) {
            String candidate = m.group(1).trim();
            for (String loc : LOCATION_WORDS_TO_STRIP) {
                candidate = candidate.replace(loc, "").trim();
            }
            candidate = candidate.replaceAll("[\\s\\-.]+$", "").trim();
            if (!candidate.isEmpty()) {
                return candidate;
            }
        }
        return null;
    }

    private static String findKnownLocation(String norm) {
        for (String[] loc : KNOWN_LOCATIONS) {
            if (norm.contains(loc[0])) {
                return loc[1];
            }
        }
        return null;
    }

    /** @return {min, max} tính theo VNĐ, hoặc null nếu không tìm thấy mức lương. */
    private static long[] findSalary(String norm) {
        Matcher range = SALARY_RANGE.matcher(norm);
        if (range.find()) {
            long a = toMillionVnd(range.group(1));
            long b = toMillionVnd(range.group(2));
            return new long[]{Math.min(a, b), Math.max(a, b)};
        }
        Matcher single = SALARY_SINGLE.matcher(norm);
        if (single.find()) {
            long v = toMillionVnd(single.group(1));
            return new long[]{v, v};
        }
        return null;
    }

    private static long toMillionVnd(String number) {
        return Math.round(Double.parseDouble(number.replace(',', '.')) * 1_000_000d);
    }

    private static ZonedDateTime findDateTime(String norm, ZonedDateTime now) {
        Integer day = null;
        Integer month = null;
        Integer year = null;
        Matcher words = DATE_WORDS.matcher(norm);
        Matcher slash = DATE.matcher(norm);
        if (words.find()) {
            day = Integer.valueOf(words.group(1));
            month = Integer.valueOf(words.group(2));
            year = words.group(3) == null ? null : Integer.valueOf(words.group(3));
        } else if (slash.find()) {
            day = Integer.valueOf(slash.group(1));
            month = Integer.valueOf(slash.group(2));
            if (slash.group(3) != null) {
                int y = Integer.parseInt(slash.group(3));
                year = y < 100 ? 2000 + y : y;
            }
        }
        if (day == null || month == null || month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
        }
        int hour = 19;
        int minute = 0;
        Matcher t = TIME.matcher(norm);
        if (t.find()) {
            hour = Integer.parseInt(t.group(1));
            minute = t.group(2) == null ? 0 : Integer.parseInt(t.group(2));
            if (hour >= 1 && hour <= 11 && (norm.contains("toi") || norm.contains("chieu"))) {
                hour += 12;
            }
        }
        if (hour > 23 || minute > 59) {
            return null;
        }
        try {
            int y = year != null ? year : now.getYear();
            ZonedDateTime candidate = LocalDateTime.of(LocalDate.of(y, month, day), java.time.LocalTime.of(hour, minute)).atZone(VN_ZONE);
            if (year == null && candidate.isBefore(now)) {
                candidate = candidate.plusYears(1);
            }
            return candidate;
        } catch (RuntimeException ex) {
            return null;
        }
    }

    // ------------------------------------------------------------------ tiện ích định dạng

    private static String formatWhen(ZonedDateTime t) {
        // Không in thứ trong tuần: người dùng có thể đã ghi thứ riêng trong ý tưởng và tránh mâu thuẫn với ngày.
        return String.format("%02d:%02d, ngày %02d/%02d/%d", t.getHour(), t.getMinute(), t.getDayOfMonth(), t.getMonthValue(), t.getYear());
    }

    private static String shortWhen(ZonedDateTime t) {
        return String.format("%02d:%02d • %02d/%02d/%d", t.getHour(), t.getMinute(), t.getDayOfMonth(), t.getMonthValue(), t.getYear());
    }

    static String formatVnd(long amount) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ROOT);
        symbols.setGroupingSeparator('.');
        return new DecimalFormat("#,###", symbols).format(amount);
    }

    private static String formatSalaryText(long min, long max) {
        if (min == max) {
            return formatMillions(min) + " triệu VNĐ/tháng";
        }
        return formatMillions(min) + " - " + formatMillions(max) + " triệu VNĐ/tháng";
    }

    private static String formatMillions(long vnd) {
        double m = vnd / 1_000_000d;
        return m == Math.floor(m) ? String.valueOf((long) m) : String.valueOf(Math.round(m * 10) / 10d);
    }

    private static boolean containsAny(String norm, String... needles) {
        String padded = " " + norm + " ";
        for (String n : needles) {
            if (padded.contains(n)) {
                return true;
            }
        }
        return false;
    }

    private static String firstGroup(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group(1) : null;
    }

    private static String firstMatch(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group() : null;
    }

    private static String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }
        return s.substring(0, 1).toUpperCase(Locale.ROOT) + s.substring(1);
    }

    private static String shorten(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.trim();
        if (t.length() <= max) {
            return t;
        }
        int cut = t.lastIndexOf(' ', max);
        return t.substring(0, cut > max / 2 ? cut : max).trim();
    }

    private static String joinNonBlank(String sep, String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p != null && !p.isBlank()) {
                if (sb.length() > 0) {
                    sb.append(sep);
                }
                sb.append(p.trim());
            }
        }
        return sb.length() == 0 ? null : sb.toString();
    }
}
