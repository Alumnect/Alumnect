package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.enums.ProfanitySeverity;
import com.alumnect.alumnect_backend.common.util.ProfanityUtils;
import com.alumnect.alumnect_backend.common.util.ProfanityUtils.Token;
import com.alumnect.alumnect_backend.service.moderation.ProfanityDictionary.Entry;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Cài đặt bộ lọc từ cấm theo từng từ, có phân biệt dấu tiếng Việt.
 * Quy tắc cốt lõi: từ gõ có dấu phải khớp đúng dấu, nên "lớn", "các", "buổi" không bao giờ khớp "lồn", "cặc", "buồi".
 * Từ gõ không dấu mà trùng từ bình thường chỉ là tín hiệu yếu; từ có dấu hiệu né lọc được tính đủ mức.
 * Mỗi lần quét có độ phức tạp tuyến tính theo số từ nhân độ dài cụm dài nhất.
 */
@Service
@Slf4j
public class ProfanityFilterServiceImpl implements ProfanityFilterService {

    private static final List<String> BLOCKLISTS = List.of("profanity/profanity_vi.txt", "profanity/profanity_en.txt");
    private static final String SAFELIST = "profanity/profanity_whitelist.txt";
    private static final String MASK = "***";

    /** Giới hạn tổ hợp dạng chữ của một cụm, đủ cho từ kéo dài hoặc leetspeak mà không bùng nổ. */
    private static final int MAX_KEYS_PER_WINDOW = 32;

    /** Số từ tối đa được ghép lại khi người viết tách chữ để né lọc. */
    private static final int MAX_SPLIT_PARTS = 8;

    /** Tỷ lệ từ viết hoa từ mức này trở lên coi là cả văn bản đang viết hoa. */
    private static final double SHOUTING_RATIO = 0.7;

    private ProfanityDictionary dictionary;

    /**
     * Nạp từ điển vào bộ nhớ khi khởi động để không phải đọc đĩa ở mỗi lần quét.
     */
    @PostConstruct
    public void init() {
        dictionary = ProfanityDictionary.load(BLOCKLISTS, SAFELIST);
        log.info("Khởi tạo hoàn tất ProfanityFilterService: nạp {} từ cấm và {} cụm an toàn",
                dictionary.size(), dictionary.safeSize());
    }

    /** Ứng viên khớp tại một vị trí, tính theo chỉ số từ. */
    private record Candidate(String term, ProfanitySeverity severity, int fromToken, int toToken, boolean obfuscated) {
    }

    @Override
    public List<ProfanityMatch> analyze(String text) {
        List<Token> tokens = ProfanityUtils.tokenize(text);
        if (tokens.isEmpty()) {
            return Collections.emptyList();
        }

        boolean shouting = isShouting(tokens);
        boolean accentedText = ProfanityUtils.isAccentedText(tokens);
        boolean[] safe = markSafeTokens(tokens);
        List<ProfanityMatch> matches = new ArrayList<>();

        int index = 0;
        while (index < tokens.size()) {
            Candidate candidate = findCandidate(tokens, index, shouting, accentedText);
            if (candidate == null) {
                index++;
                continue;
            }
            if (!isCovered(safe, candidate)) {
                matches.add(new ProfanityMatch(candidate.term(), candidate.severity(),
                        tokens.get(candidate.fromToken()).start(), tokens.get(candidate.toToken() - 1).end(),
                        candidate.obfuscated()));
            }
            index = candidate.toToken();
        }
        return matches;
    }

    @Override
    public boolean containsProfanity(String text) {
        return !findProfanities(text).isEmpty();
    }

    @Override
    public List<String> findProfanities(String text) {
        Set<String> terms = new LinkedHashSet<>();
        for (ProfanityMatch match : analyze(text)) {
            if (match.severity() != ProfanitySeverity.WEAK) {
                terms.add(match.term());
            }
        }
        return List.copyOf(terms);
    }

    @Override
    public String maskProfanity(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        List<ProfanityMatch> matches = analyze(text);
        StringBuilder masked = new StringBuilder(text);
        for (int i = matches.size() - 1; i >= 0; i--) {
            ProfanityMatch match = matches.get(i);
            if (match.severity() != ProfanitySeverity.WEAK) {
                // Không để chuỗi che dài hơn từ gốc, tránh nội dung vượt giới hạn độ dài của cột khi lưu
                int length = Math.min(MASK.length(), match.end() - match.start());
                masked.replace(match.start(), match.end(), MASK.substring(0, length));
            }
        }
        return masked.toString();
    }

    /** Đánh dấu các từ thuộc cụm an toàn; cụm chỉ bảo vệ đúng đoạn của nó, không bảo vệ cả văn bản. */
    private boolean[] markSafeTokens(List<Token> tokens) {
        boolean[] safe = new boolean[tokens.size()];
        for (int start = 0; start < tokens.size(); start++) {
            int longest = Math.min(dictionary.maxSafeTokens(), tokens.size() - start);
            for (int length = longest; length >= 1; length--) {
                if (isSafeWindow(tokens, start, length)) {
                    for (int i = start; i < start + length; i++) {
                        safe[i] = true;
                    }
                    break;
                }
            }
        }
        return safe;
    }

    private boolean isSafeWindow(List<Token> tokens, int start, int length) {
        StringBuilder exact = new StringBuilder();
        StringBuilder folded = new StringBuilder();
        boolean plain = true;
        for (int i = start; i < start + length; i++) {
            Token token = tokens.get(i);
            if (token.obfuscated()) {
                return false;
            }
            if (i > start) {
                exact.append(' ');
                folded.append(' ');
            }
            exact.append(token.exact());
            folded.append(token.folded());
            plain &= token.plain();
        }
        return dictionary.isSafe(exact.toString(), folded.toString(), plain);
    }

    private static boolean isCovered(boolean[] safe, Candidate candidate) {
        for (int i = candidate.fromToken(); i < candidate.toToken(); i++) {
            if (!safe[i]) {
                return false;
            }
        }
        return true;
    }

    /** Tìm ứng viên tại vị trí cho trước theo thứ tự: cụm dài nhất, từ viết liền, từ che dấu sao, chữ bị tách. */
    private Candidate findCandidate(List<Token> tokens, int index, boolean shouting, boolean accentedText) {
        Candidate phrase = matchPhrase(tokens, index, shouting, accentedText);
        if (phrase != null && phrase.severity() != ProfanitySeverity.WEAK) {
            return phrase;
        }
        Candidate compound = matchCompound(tokens, index);
        if (compound != null) {
            return compound;
        }
        Candidate wildcard = matchWildcard(tokens, index);
        if (wildcard != null) {
            return wildcard;
        }
        Candidate split = matchSplitLetters(tokens, index);
        return split != null ? split : phrase;
    }

    private Candidate matchPhrase(List<Token> tokens, int index, boolean shouting, boolean accentedText) {
        int longest = Math.min(dictionary.maxTokens(), tokens.size() - index);
        for (int length = longest; length >= 1; length--) {
            Candidate best = null;
            for (String key : windowKeys(tokens, index, length)) {
                for (Entry entry : dictionary.lookup(key)) {
                    Candidate candidate = evaluate(entry, tokens, index, length, shouting, accentedText);
                    if (candidate != null && (best == null
                            || candidate.severity().compareTo(best.severity()) > 0)) {
                        best = candidate;
                    }
                }
            }
            if (best != null) {
                return best;
            }
        }
        return null;
    }

    /** Sinh các khóa tra cứu của một cụm từ từ tổ hợp dạng chữ của mỗi từ, có giới hạn trên. */
    private static List<String> windowKeys(List<Token> tokens, int start, int length) {
        List<String> keys = new ArrayList<>(List.of(""));
        for (int i = start; i < start + length; i++) {
            Set<String> forms = tokens.get(i).foldedForms();
            List<String> extended = new ArrayList<>(Math.min(keys.size() * forms.size(), MAX_KEYS_PER_WINDOW));
            for (String prefix : keys) {
                for (String form : forms) {
                    if (extended.size() < MAX_KEYS_PER_WINDOW) {
                        extended.add(prefix.isEmpty() ? form : prefix + " " + form);
                    }
                }
            }
            keys = extended;
        }
        return keys;
    }

    /** So từng từ với mục từ điển rồi quyết định mức nghiêm trọng; trả về null nếu không khớp. */
    private Candidate evaluate(Entry entry, List<Token> tokens, int start, int length, boolean shouting,
                               boolean accentedText) {
        if (entry.tokens().length != length) {
            return null;
        }
        boolean allExact = true;
        boolean anyObfuscated = false;
        for (int i = 0; i < length; i++) {
            Token token = tokens.get(start + i);
            String expected = entry.tokens()[i];
            String expectedFolded = entry.foldedTokens()[i];
            boolean exactMatch = token.exact().equals(expected) || token.shortened().equals(expected);
            if (exactMatch) {
                anyObfuscated |= token.obfuscated();
                continue;
            }
            allExact = false;
            if (token.decodedForms().contains(expectedFolded)) {
                anyObfuscated = true;
            } else if (token.obfuscated() && token.foldedForms().contains(expectedFolded)) {
                anyObfuscated = true;
            } else if (!token.plain()
                    || !(token.folded().equals(expectedFolded) || token.foldedShort().equals(expectedFolded))) {
                // Từ có dấu nhưng khác dấu với từ điển là từ khác, đây là chốt chặn bắt nhầm chính
                return null;
            }
        }

        if (entry.acronym() && isPlainAcronymUsage(tokens, start, shouting)) {
            return null;
        }
        if (!allExact && !anyObfuscated && isPlainHomograph(entry, length)) {
            return null;
        }
        ProfanitySeverity severity = entry.contextual() && !accentedText && !anyObfuscated
                ? ProfanitySeverity.WEAK
                : resolveSeverity(entry, allExact, anyObfuscated, accentedText);
        return new Candidate(entry.term(), severity, start, start + length, anyObfuscated);
    }

    /** Hạ mức khi mục cần đúng dấu mà người viết gõ không dấu, trừ khi có dấu hiệu cố tình né lọc. */
    private static ProfanitySeverity resolveSeverity(Entry entry, boolean allExact, boolean obfuscated,
                                                     boolean accentedText) {
        if (allExact || obfuscated || !entry.accentRequired()) {
            return entry.severity();
        }
        if (entry.strict() && !accentedText) {
            return ProfanitySeverity.WEAK;
        }
        return entry.severity().downgrade();
    }

    /** Từ đơn gõ không dấu như "cho", "di", "lao" là từ hợp lệ, không phải cách viết khác của "chó", "đĩ", "láo". */
    private static boolean isPlainHomograph(Entry entry, int length) {
        return length == 1 && (entry.accentRequired() || entry.severity() == ProfanitySeverity.WEAK);
    }

    /** "CC", "DM" viết hoa giữa câu thường, "150 cc", "500 ml" đứng sau số hoặc mã như "ml-10" là viết tắt bình thường. */
    private static boolean isPlainAcronymUsage(List<Token> tokens, int start, boolean shouting) {
        boolean afterNumber = start > 0 && tokens.get(start - 1).numeric();
        boolean codeLike = start + 1 < tokens.size() && tokens.get(start + 1).numeric()
                && tokens.get(start + 1).punctuationGap();
        if (codeLike) {
            return true;
        }
        return afterNumber || (tokens.get(start).upperCase() && !shouting);
    }

    private Candidate matchCompound(List<Token> tokens, int index) {
        Token token = tokens.get(index);
        for (String form : token.foldedForms()) {
            Entry entry = dictionary.lookupCompound(form);
            if (entry != null) {
                return new Candidate(entry.term(), entry.severity(), index, index + 1, token.obfuscated());
            }
        }
        return null;
    }

    /** So khớp từ tự che bằng dấu sao ("f*ck", "đ*t") với các mục một từ. */
    private Candidate matchWildcard(List<Token> tokens, int index) {
        Token token = tokens.get(index);
        if (token.wildcardPattern() == null) {
            return null;
        }
        for (Entry entry : dictionary.singleWordEntries()) {
            if (token.wildcardPattern().matcher(entry.foldedTokens()[0]).matches()) {
                return new Candidate(entry.term(), entry.severity(), index, index + 1, true);
            }
        }
        return null;
    }

    /**
     * Ghép các mảnh chữ bị tách ("l.o.n", "đ-m", "c ặ c") rồi tra từ điển.
     * Tách bằng dấu câu là né lọc rõ ràng nên tính đủ mức. Tách bằng khoảng trắng chỉ tính khi còn dấu hoặc
     * mục không trùng từ thường, để đáp án trắc nghiệm "c a c" không bị coi là từ cấm.
     */
    private Candidate matchSplitLetters(List<Token> tokens, int index) {
        StringBuilder joined = new StringBuilder(tokens.get(index).exact());
        boolean punctuated = false;
        Candidate best = null;

        for (int end = index + 1; end < tokens.size() && end - index < MAX_SPLIT_PARTS; end++) {
            Token next = tokens.get(end);
            Token previous = tokens.get(end - 1);
            boolean shortPieces = previous.length() <= 2 && next.length() <= 2;
            boolean shortJoin = next.punctuationGap() && (previous.length() <= 2 || next.length() <= 2);
            if (next.numeric() || previous.numeric() || !(shortPieces || shortJoin)) {
                break;
            }
            punctuated |= next.punctuationGap();
            joined.append(next.exact());

            Candidate candidate = lookupJoined(joined.toString(), index, end + 1, punctuated);
            if (candidate != null) {
                best = candidate;
            }
        }
        return best;
    }

    private Candidate lookupJoined(String joined, int from, int to, boolean punctuated) {
        String folded = ProfanityUtils.fold(joined);
        for (Entry entry : dictionary.lookup(folded)) {
            if (entry.tokens().length != 1) {
                continue;
            }
            boolean exact = entry.tokens()[0].equals(joined);
            if (punctuated || (exact && !joined.equals(folded)) || !entry.accentRequired()) {
                return new Candidate(entry.term(), entry.severity(), from, to, true);
            }
        }
        return null;
    }

    private static boolean isShouting(List<Token> tokens) {
        int words = 0;
        int upper = 0;
        for (Token token : tokens) {
            if (!token.numeric()) {
                words++;
                if (token.upperCase()) {
                    upper++;
                }
            }
        }
        return words > 0 && upper >= words * SHOUTING_RATIO;
    }
}
