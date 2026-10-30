package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.util.ProfanityUtils;
import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cài đặt dịch vụ lọc từ cấm đa ngôn ngữ sử dụng tệp tài nguyên tĩnh trên Classpath.
 * Nạp sẵn toàn bộ từ điển vào bộ nhớ RAM khi khởi động ứng dụng để tối ưu hiệu năng quét.
 */
@Service
@Slf4j
public class ProfanityFilterServiceImpl implements ProfanityFilterService {

    private final Set<String> profanities = new LinkedHashSet<>();
    private final Set<String> whitelist = new HashSet<>();
    private final List<String> sortedProfanities = new ArrayList<>();

    @PostConstruct
    public void init() {
        loadProfanitiesFromResource("profanity/profanity_vi.txt");
        loadProfanitiesFromResource("profanity/profanity_en.txt");
        loadWhitelistFromResource("profanity/profanity_whitelist.txt");

        // Sắp xếp các từ cấm theo chiều giảm dần của độ dài để ưu tiên bắt cụm từ ghép trước từ đơn
        sortedProfanities.addAll(profanities);
        sortedProfanities.sort((a, b) -> Integer.compare(b.length(), a.length()));

        log.info("Khởi tạo hoàn tất ProfanityFilterService: nạp {} từ cấm và {} từ whitelist",
                sortedProfanities.size(), whitelist.size());
    }

    private void loadProfanitiesFromResource(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                log.warn("Không tìm thấy tệp từ cấm tại đường dẫn: {}", path);
                return;
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (!line.isEmpty() && !line.startsWith("#")) {
                        String normalized = ProfanityUtils.normalizeForProfanityCheck(line);
                        if (!normalized.isEmpty()) {
                            profanities.add(normalized);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Lỗi khi nạp tệp từ cấm {}: {}", path, ex.getMessage(), ex);
        }
    }

    private void loadWhitelistFromResource(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                log.warn("Không tìm thấy tệp whitelist tại đường dẫn: {}", path);
                return;
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (!line.isEmpty() && !line.startsWith("#")) {
                        String normalized = ProfanityUtils.normalizeForProfanityCheck(line);
                        if (!normalized.isEmpty()) {
                            whitelist.add(normalized);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Lỗi khi nạp tệp whitelist {}: {}", path, ex.getMessage(), ex);
        }
    }

    @Override
    public boolean containsProfanity(String text) {
        return !findProfanities(text).isEmpty();
    }

    @Override
    public List<String> findProfanities(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        String normalized = ProfanityUtils.normalizeForProfanityCheck(text);
        if (normalized.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> rawDetected = new ArrayList<>();
        String paddedText = " " + normalized + " ";

        for (String badWord : sortedProfanities) {
            String searchPattern = " " + badWord + " ";
            if (paddedText.contains(searchPattern)) {
                // Kiểm tra xem từ này có được bảo vệ bởi cụm từ an toàn trong whitelist không
                if (!isWhitelisted(badWord, paddedText)) {
                    rawDetected.add(badWord);
                }
            }
        }

        if (rawDetected.isEmpty()) {
            return Collections.emptyList();
        }

        // Loại bỏ từ con trùng lặp: Nếu đã bắt cụm từ dài (vd "vai lon") thì không tính thêm từ con "lon"
        List<String> filteredDetected = new ArrayList<>();
        for (String word : rawDetected) {
            boolean isSubWord = false;
            for (String otherWord : rawDetected) {
                if (!word.equals(otherWord) && otherWord.contains(word)) {
                    isSubWord = true;
                    break;
                }
            }
            if (!isSubWord) {
                filteredDetected.add(word);
            }
        }

        return filteredDetected;
    }

    @Override
    public String maskProfanity(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        List<String> badWords = findProfanities(text);
        if (badWords.isEmpty()) {
            return text;
        }

        String result = text;
        for (String badWord : badWords) {
            // Xây dựng regex linh hoạt khớp cả từ có dấu hoặc không dấu
            String regex = buildFlexibleRegex(badWord);
            result = result.replaceAll("(?i)" + regex, "***");
        }
        return result;
    }

    /**
     * Tạo biểu thức chính quy linh hoạt cho phép khớp từ tiếng Việt có dấu tương ứng với từ không dấu
     */
    private String buildFlexibleRegex(String normalizedWord) {
        StringBuilder sb = new StringBuilder("(?<=\\s|^|[.,!?;:])");
        String[] parts = normalizedWord.split("\\s+");
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                sb.append("[\\s._\\-*#~]+");
            }
            sb.append(toVietnameseRegex(parts[i]));
        }
        sb.append("(?=\\s|$|[.,!?;:])");
        return sb.toString();
    }

    private String toVietnameseRegex(String plainWord) {
        StringBuilder sb = new StringBuilder();
        for (char c : plainWord.toCharArray()) {
            switch (c) {
                case 'a': sb.append("[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ@4]"); break;
                case 'e': sb.append("[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ3]"); break;
                case 'i': sb.append("[iìíỉĩịIÌÍỈĨỊ1!]"); break;
                case 'o': sb.append("[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ0]"); break;
                case 'u': sb.append("[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]"); break;
                case 'y': sb.append("[yỳýỷỹỵYỲÝỶỸỴ]"); break;
                case 'd': sb.append("[dđDĐ]"); break;
                default:
                    sb.append(Pattern.quote(String.valueOf(c)));
            }
        }
        return sb.toString();
    }

    private boolean isWhitelisted(String badWord, String paddedText) {
        for (String whiteWord : whitelist) {
            if (whiteWord.contains(badWord)) {
                String whitePattern = " " + whiteWord + " ";
                if (paddedText.contains(whitePattern)) {
                    return true;
                }
            }
        }
        return false;
    }
}
