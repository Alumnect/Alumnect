package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.enums.ProfanitySeverity;
import com.alumnect.alumnect_backend.common.util.ProfanityUtils;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Từ điển từ cấm và cụm an toàn được nạp một lần vào bộ nhớ khi ứng dụng khởi động.
 * Định dạng tệp: mỗi dòng một mục, dòng bắt đầu bằng "#" là chú thích, dòng "[mức cờ]" mở một nhóm mới.
 * Mức là severe, offensive hoặc weak; cờ accented nghĩa là dạng không dấu trùng từ bình thường, cờ acronym
 * nghĩa là viết tắt chỉ tính khi không viết hoa và không đứng sau số, cờ contextual nghĩa là chỉ tính đủ mức
 * khi văn bản được gõ có dấu, cờ strict nghĩa là cụm gõ không dấu trong văn bản không dấu chỉ là tín hiệu yếu.
 * Cú pháp {a|b} sinh ra mọi tổ hợp.
 */
public final class ProfanityDictionary {

    private static final Pattern ALTERNATION_PATTERN = Pattern.compile("\\{([^{}]*)}");

    /** Từ ghép viết liền ngắn hơn ngưỡng này dễ trùng từ khác nên không được lập chỉ mục. */
    private static final int MIN_COMPOUND_LENGTH = 5;

    /**
     * Một mục từ cấm trong từ điển.
     *
     * @param term           Từ khóa nguyên dạng để hiển thị
     * @param tokens         Các từ đơn còn dấu
     * @param foldedTokens   Các từ đơn đã khử dấu
     * @param severity       Mức độ nghiêm trọng khi khớp đúng dấu
     * @param accentRequired Dạng không dấu trùng từ bình thường nên phải hạ mức khi gõ không dấu
     * @param acronym        Viết tắt, bỏ qua khi viết hoa toàn bộ hoặc đứng sau số
     * @param contextual     Chỉ tính đủ mức khi cả văn bản được gõ có dấu
     * @param strict         Dạng không dấu của cụm trùng cụm thường gặp ("nhu cac", "tu tu di")
     */
    public record Entry(String term, String[] tokens, String[] foldedTokens, ProfanitySeverity severity,
                        boolean accentRequired, boolean acronym, boolean contextual, boolean strict) {
    }

    private final Map<String, List<Entry>> byFolded = new HashMap<>();
    private final Map<String, Entry> byCompound = new HashMap<>();
    private final List<Entry> singleWordEntries = new ArrayList<>();
    private final Set<String> safeExact = new HashSet<>();
    private final Set<String> safeFolded = new HashSet<>();
    private int maxTokens = 1;
    private int maxSafeTokens = 1;

    private ProfanityDictionary() {
    }

    /**
     * Nạp từ điển từ các tệp tài nguyên trên classpath.
     * Thiếu tệp là lỗi đóng gói nên ném ngoại lệ ngay khi khởi động, tránh bộ lọc âm thầm không hoạt động.
     *
     * @param blocklistPaths Đường dẫn các tệp từ cấm
     * @param safelistPath   Đường dẫn tệp cụm an toàn
     * @return Từ điển đã sẵn sàng tra cứu
     */
    public static ProfanityDictionary load(List<String> blocklistPaths, String safelistPath) {
        ProfanityDictionary dictionary = new ProfanityDictionary();
        for (String path : blocklistPaths) {
            dictionary.loadBlocklist(path);
        }
        dictionary.loadSafelist(safelistPath);
        return dictionary;
    }

    /**
     * Tra các mục từ cấm theo dạng khử dấu của một cụm từ.
     *
     * @param foldedPhrase Cụm từ đã khử dấu, các từ cách nhau một khoảng trắng
     * @return Các mục có cùng dạng khử dấu, rỗng nếu không có
     */
    public List<Entry> lookup(String foldedPhrase) {
        return byFolded.getOrDefault(foldedPhrase, List.of());
    }

    /**
     * Tra mục từ cấm theo dạng viết liền không dấu ("cailon", "ditme").
     *
     * @param foldedWord Từ đã khử dấu
     * @return Mục tương ứng hoặc null
     */
    public Entry lookupCompound(String foldedWord) {
        return byCompound.get(foldedWord);
    }

    /**
     * Kiểm tra cụm từ có nằm trong danh sách an toàn hay không.
     * Cụm gõ không dấu đối chiếu không dấu; cụm có dấu phải khớp đúng dấu để "cặc bạn" không lọt nhờ "các bạn".
     *
     * @param exactPhrase  Cụm từ còn dấu
     * @param foldedPhrase Cụm từ đã khử dấu
     * @param plain        Toàn bộ cụm được gõ không dấu
     * @return true nếu cụm an toàn
     */
    public boolean isSafe(String exactPhrase, String foldedPhrase, boolean plain) {
        return plain ? safeFolded.contains(foldedPhrase) : safeExact.contains(exactPhrase);
    }

    /**
     * Lấy danh sách mục đơn từ dùng cho so khớp dấu sao.
     *
     * @return Danh sách mục một từ, không gồm tín hiệu yếu
     */
    public List<Entry> singleWordEntries() {
        return singleWordEntries;
    }

    /**
     * Lấy số từ của cụm từ cấm dài nhất.
     *
     * @return Số từ tối đa
     */
    public int maxTokens() {
        return maxTokens;
    }

    /**
     * Lấy số từ của cụm an toàn dài nhất.
     *
     * @return Số từ tối đa
     */
    public int maxSafeTokens() {
        return maxSafeTokens;
    }

    /**
     * Đếm số mục từ cấm đã nạp.
     *
     * @return Số mục sau khi sinh tổ hợp và loại trùng
     */
    public int size() {
        return byFolded.values().stream().mapToInt(List::size).sum();
    }

    /**
     * Đếm số cụm an toàn đã nạp.
     *
     * @return Số cụm
     */
    public int safeSize() {
        return safeExact.size();
    }

    private void loadBlocklist(String path) {
        ProfanitySeverity severity = null;
        boolean accentRequired = false;
        boolean acronym = false;
        boolean contextual = false;
        boolean strict = false;
        Set<String> seen = new HashSet<>();

        for (String line : readLines(path)) {
            if (line.startsWith("[") && line.endsWith("]")) {
                List<String> parts = Arrays.asList(line.substring(1, line.length() - 1).trim().split("\\s+"));
                severity = ProfanitySeverity.valueOf(parts.get(0).toUpperCase());
                accentRequired = parts.contains("accented");
                acronym = parts.contains("acronym");
                contextual = parts.contains("contextual");
                strict = parts.contains("strict");
                continue;
            }
            if (severity == null) {
                throw new IllegalStateException("Mục từ điển nằm ngoài nhóm mức độ trong " + path + ": " + line);
            }
            for (String term : expand(line)) {
                String normalized = ProfanityUtils.normalizeTerm(term);
                if (seen.add(normalized)) {
                    index(normalized, severity, accentRequired, acronym, contextual, strict);
                }
            }
        }
    }

    private void index(String term, ProfanitySeverity severity, boolean accentRequired, boolean acronym,
                       boolean contextual, boolean strict) {
        String[] tokens = term.split(" ");
        String[] folded = Arrays.stream(tokens).map(ProfanityUtils::fold).toArray(String[]::new);
        // Mục cần đúng dấu nhưng bản thân không có dấu ("con ngu") không phân biệt được bằng dấu, phải xét cả văn bản
        boolean dependsOnContext = contextual || (accentRequired && term.equals(ProfanityUtils.fold(term)));
        Entry entry = new Entry(term, tokens, folded, severity, accentRequired, acronym, dependsOnContext, strict);

        byFolded.computeIfAbsent(String.join(" ", folded), key -> new ArrayList<>()).add(entry);
        maxTokens = Math.max(maxTokens, tokens.length);

        if (tokens.length == 1) {
            if (severity != ProfanitySeverity.WEAK) {
                singleWordEntries.add(entry);
            }
            return;
        }
        String compound = String.join("", folded);
        if (compound.length() >= MIN_COMPOUND_LENGTH && (severity == ProfanitySeverity.SEVERE || !accentRequired)) {
            byCompound.merge(compound, entry, (current, candidate) ->
                    candidate.severity().compareTo(current.severity()) > 0 ? candidate : current);
        }
    }

    private void loadSafelist(String path) {
        for (String line : readLines(path)) {
            for (String phrase : expand(line)) {
                String normalized = ProfanityUtils.normalizeTerm(phrase);
                String folded = ProfanityUtils.fold(normalized);
                safeExact.add(normalized);
                safeFolded.add(folded);
                maxSafeTokens = Math.max(maxSafeTokens, normalized.split(" ").length);
            }
        }
    }

    /** Sinh mọi tổ hợp từ cú pháp {a|b}; lựa chọn rỗng cho phép bỏ qua cả nhóm. */
    private static Set<String> expand(String line) {
        Set<String> results = new LinkedHashSet<>();
        Matcher matcher = ALTERNATION_PATTERN.matcher(line);
        if (!matcher.find()) {
            results.add(line);
            return results;
        }
        String head = line.substring(0, matcher.start());
        String tail = line.substring(matcher.end());
        for (String option : matcher.group(1).split("\\|", -1)) {
            String candidate = (head + option.trim() + tail).trim();
            if (!candidate.isEmpty()) {
                results.addAll(expand(candidate));
            }
        }
        return results;
    }

    private static List<String> readLines(String path) {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException("Không tìm thấy tệp từ điển kiểm duyệt: " + path);
        }
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                    lines.add(trimmed);
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Không đọc được tệp từ điển kiểm duyệt: " + path, ex);
        }
        return lines;
    }
}
