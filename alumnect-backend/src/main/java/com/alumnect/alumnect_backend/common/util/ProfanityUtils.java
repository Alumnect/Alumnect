package com.alumnect.alumnect_backend.common.util;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Lớp tiện ích tách từ và chuẩn hóa văn bản phục vụ bộ lọc từ cấm (UC123).
 * Mỗi từ giữ nguyên vị trí trong văn bản gốc và dấu tiếng Việt, vì "lớn" và "lồn" chỉ khác nhau ở dấu.
 * Các dấu hiệu né lọc (thay số, chèn ký tự, ký tự Unicode giả dạng) được ghi nhận thay vì bị xóa bỏ âm thầm.
 */
public final class ProfanityUtils {

    /** Bảng chữ cái có dấu của tiếng Việt, chữ có dấu ngoài bảng này được coi là cố tình giả dạng. */
    private static final String VIETNAMESE_LETTERS =
            "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ";

    /** Đuôi tên miền phổ biến; cụm kết thúc bằng các đuôi này là địa chỉ, không phải lời nói. */
    private static final Set<String> DOMAIN_SUFFIXES =
            Set.of("com", "vn", "net", "org", "edu", "io", "gov", "info", "me", "dev", "app", "ai");

    /** Dấu câu có thể bao quanh liên kết trong câu văn. */
    private static final String SURROUNDING_PUNCTUATION = "()[]{}<>\"'.,;:!?";

    /** Số kèm đơn vị (10k, 50m, 100n) không phải leetspeak. */
    private static final Pattern NUMBER_WITH_UNIT_PATTERN = Pattern.compile("^\\d+\\p{L}{1,3}$");

    /** Mã ngắn như khối D1, giấy A4, H264 không phải leetspeak. */
    private static final Pattern SHORT_CODE_PATTERN = Pattern.compile("^\\p{L}{1,2}\\d+$");

    /** Ký tự Kirin và Hy Lạp có hình dạng giống chữ Latin, thường dùng để lách bộ lọc. */
    private static final Map<Character, Character> LOOKALIKES = Map.ofEntries(
            Map.entry('а', 'a'), Map.entry('е', 'e'), Map.entry('о', 'o'), Map.entry('р', 'p'),
            Map.entry('с', 'c'), Map.entry('у', 'y'), Map.entry('х', 'x'), Map.entry('і', 'i'),
            Map.entry('ѕ', 's'), Map.entry('ј', 'j'), Map.entry('к', 'k'), Map.entry('м', 'm'),
            Map.entry('т', 't'), Map.entry('в', 'b'), Map.entry('н', 'h'), Map.entry('л', 'l'),
            Map.entry('ο', 'o'), Map.entry('α', 'a'), Map.entry('ι', 'i'), Map.entry('ν', 'v'),
            Map.entry('κ', 'k'), Map.entry('ρ', 'p'), Map.entry('τ', 't'), Map.entry('υ', 'u'));

    /** Số dạng chữ tối đa sinh ra khi giải mã leetspeak cho một từ, tránh bùng nổ tổ hợp. */
    private static final int MAX_DECODED_FORMS = 8;

    private ProfanityUtils() {
        // Lớp tiện ích tĩnh
    }

    /**
     * Một từ trong văn bản cùng các dạng chuẩn hóa dùng để đối soát.
     *
     * @param start           Vị trí bắt đầu trong văn bản gốc
     * @param end             Vị trí kết thúc (không bao gồm) trong văn bản gốc
     * @param exact           Chữ thường còn dấu, ký tự lặp từ 3 lần rút còn 2 ("đmmmm" thành "đmm")
     * @param shortened       Như exact nhưng rút hết phụ âm đôi ("đmm" thành "đm", "lồnnn" thành "lồn")
     * @param folded          Dạng khử dấu của exact
     * @param foldedShort     Dạng khử dấu của shortened
     * @param plain           Từ được gõ hoàn toàn không dấu
     * @param obfuscated      Từ có dấu hiệu cố tình né lọc
     * @param decodedForms    Các dạng khử dấu sau khi giải mã leetspeak, rỗng nếu từ không bị che giấu
     * @param wildcardPattern Mẫu so khớp khi từ tự che bằng dấu sao ("f*ck"), null nếu không có
     * @param upperCase       Từ được viết hoa toàn bộ trong văn bản gốc
     * @param numeric         Từ chỉ gồm chữ số
     * @param punctuationGap  Từ này nối liền từ trước bằng dấu câu, không có khoảng trắng ("l.o.n")
     */
    public record Token(int start, int end, String exact, String shortened, String folded, String foldedShort,
                        boolean plain, boolean obfuscated, List<String> decodedForms, Pattern wildcardPattern,
                        boolean upperCase, boolean numeric, boolean punctuationGap) {

        /**
         * Lấy mọi dạng khử dấu của từ để tra cứu từ điển.
         *
         * @return Tập dạng khử dấu không trùng, ưu tiên dạng đầy đủ trước
         */
        public Set<String> foldedForms() {
            Set<String> forms = new LinkedHashSet<>();
            forms.add(folded);
            forms.add(foldedShort);
            forms.addAll(decodedForms);
            return forms;
        }

        /**
         * Lấy độ dài của từ sau chuẩn hóa.
         *
         * @return Số ký tự của dạng exact
         */
        public int length() {
            return exact.length();
        }
    }

    /**
     * Khử dấu và chuyển chữ thường, giữ nguyên khoảng trắng bên trong chuỗi.
     *
     * @param text Chuỗi cần khử dấu
     * @return Chuỗi không dấu ở dạng chữ thường, rỗng nếu đầu vào rỗng
     */
    public static String fold(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return VietnameseStringUtils.removeAccents(text);
    }

    /**
     * Chuẩn hóa một mục trong từ điển về dạng so khớp: chữ thường, dựng sẵn dấu (NFC), một khoảng trắng giữa các từ.
     *
     * @param term Mục từ điển
     * @return Mục từ điển đã chuẩn hóa
     */
    public static String normalizeTerm(String term) {
        String composed = Normalizer.normalize(term.trim(), Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        return composed.replaceAll("\\s+", " ");
    }

    /**
     * Tách văn bản thành danh sách từ kèm vị trí gốc, bỏ qua liên kết và email.
     * Ký hiệu kiểu leetspeak nằm giữa chữ ("c@c", "sh!t", "f*ck") được giữ trong từ; dấu câu khác là ranh giới từ.
     *
     * @param text Văn bản gốc
     * @return Danh sách từ theo thứ tự xuất hiện, rỗng nếu văn bản rỗng
     */
    public static List<Token> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String speech = blankOutNonSpeech(text);
        List<Token> tokens = new ArrayList<>();
        int length = speech.length();
        int index = 0;
        boolean sawGap = false;
        boolean sawWhitespace = false;

        while (index < length) {
            int codePoint = speech.codePointAt(index);
            if (!isWordCodePoint(codePoint) && !startsLeetWord(speech, index, codePoint)) {
                sawGap = true;
                sawWhitespace |= Character.isWhitespace(codePoint);
                index += Character.charCount(codePoint);
                continue;
            }

            int start = index;
            index = findTokenEnd(speech, start);
            Token token = buildToken(text.substring(start, index), start, index, sawGap && !sawWhitespace);
            if (token != null) {
                tokens.add(token);
            }
            sawGap = false;
            sawWhitespace = false;
        }
        return tokens;
    }

    /**
     * Kiểm tra văn bản có được gõ tiếng Việt có dấu hay không.
     * Người gõ có dấu mà để một từ không dấu thì từ đó nhiều khả năng được viết đúng như vậy có chủ đích.
     *
     * @param tokens Danh sách từ của văn bản
     * @return true nếu từ 30% số từ chứa chữ trở lên có dấu
     */
    public static boolean isAccentedText(List<Token> tokens) {
        int words = 0;
        int accented = 0;
        for (Token token : tokens) {
            if (token.numeric()) {
                continue;
            }
            words++;
            if (!token.plain()) {
                accented++;
            }
        }
        return words >= 4 && accented * 10 >= words * 3;
    }

    /**
     * Thay liên kết và email bằng khoảng trắng cùng độ dài để giữ nguyên vị trí ký tự.
     * Quét tuyến tính theo từng cụm không có khoảng trắng, không dùng biểu thức chính quy lồng nhau
     * để chuỗi rất dài như "a.a.a.a" không thể gây tràn ngăn xếp và làm hỏng luồng kiểm duyệt.
     */
    private static String blankOutNonSpeech(String text) {
        StringBuilder builder = new StringBuilder(text);
        int index = 0;
        int length = text.length();
        while (index < length) {
            if (Character.isWhitespace(text.charAt(index))) {
                index++;
                continue;
            }
            int end = index;
            while (end < length && !Character.isWhitespace(text.charAt(end))) {
                end++;
            }
            if (isNonSpeech(text.substring(index, end))) {
                for (int i = index; i < end; i++) {
                    builder.setCharAt(i, ' ');
                }
            }
            index = end;
        }
        return builder.toString();
    }

    /** Nhận diện cụm là liên kết, email hoặc tên miền ASCII. */
    private static boolean isNonSpeech(String run) {
        String address = trimPunctuation(run.toLowerCase(Locale.ROOT));
        if (address.startsWith("http://") || address.startsWith("https://") || address.startsWith("www.")) {
            return true;
        }
        int slash = address.indexOf('/');
        String host = slash > 0 ? address.substring(0, slash) : address;
        int at = host.indexOf('@');
        String domain = at > 0 ? host.substring(at + 1) : host;
        int dot = domain.lastIndexOf('.');
        if (dot <= 0 || dot == domain.length() - 1 || !isAscii(host)) {
            return false;
        }
        return at > 0 || DOMAIN_SUFFIXES.contains(domain.substring(dot + 1));
    }

    private static String trimPunctuation(String text) {
        int start = 0;
        int end = text.length();
        while (start < end && SURROUNDING_PUNCTUATION.indexOf(text.charAt(start)) >= 0) {
            start++;
        }
        while (end > start && SURROUNDING_PUNCTUATION.indexOf(text.charAt(end - 1)) >= 0) {
            end--;
        }
        return text.substring(start, end);
    }

    private static boolean isAscii(String text) {
        return text.chars().allMatch(character -> character < 128);
    }

    /** Ký tự thuộc thân từ: chữ, số, dấu kết hợp, chữ khoanh tròn và ký tự vô hình chèn giữa từ. */
    private static boolean isWordCodePoint(int codePoint) {
        return Character.isLetterOrDigit(codePoint) || isMark(codePoint) || isInvisible(codePoint)
                || isEnclosedLetter(codePoint);
    }

    private static boolean isMark(int codePoint) {
        int type = Character.getType(codePoint);
        return type == Character.NON_SPACING_MARK || type == Character.COMBINING_SPACING_MARK
                || type == Character.ENCLOSING_MARK;
    }

    /** Ký tự vô hình như zero-width space, soft hyphen, ký tự điều khiển chiều văn bản. */
    private static boolean isInvisible(int codePoint) {
        return Character.getType(codePoint) == Character.FORMAT;
    }

    /** Chữ khoanh tròn, đóng khung mà NFKC đưa được về chữ Latin thường. */
    private static boolean isEnclosedLetter(int codePoint) {
        return (codePoint >= 0x24B6 && codePoint <= 0x24E9) || (codePoint >= 0x1F130 && codePoint <= 0x1F149);
    }

    private static boolean isLeetSymbol(int codePoint) {
        return codePoint == '@' || codePoint == '$' || codePoint == '!' || codePoint == '*'
                || codePoint == '+' || codePoint == '|';
    }

    /** Từ có thể mở đầu bằng "$" như "$hit". */
    private static boolean startsLeetWord(String text, int index, int codePoint) {
        return codePoint == '$' && index + 1 < text.length() && Character.isLetter(text.codePointAt(index + 1));
    }

    /** Tìm điểm kết thúc từ; ký hiệu leetspeak chỉ thuộc từ khi nằm giữa chữ và một bên là đoạn ngắn. */
    private static int findTokenEnd(String text, int start) {
        int index = start;
        int segmentLength = 0;
        int length = text.length();
        while (index < length) {
            int codePoint = text.codePointAt(index);
            if (isWordCodePoint(codePoint)) {
                index += Character.charCount(codePoint);
                segmentLength++;
                continue;
            }
            if (!isLeetSymbol(codePoint)) {
                break;
            }
            int next = index;
            while (next < length && isLeetSymbol(text.codePointAt(next))) {
                next += Character.charCount(text.codePointAt(next));
            }
            int nextSegment = countWordChars(text, next);
            // Ký hiệu cuối từ ("đm!!!") là dấu câu; hai đoạn đều dài ("ngu!mày") là hai từ riêng
            if (nextSegment == 0 || (segmentLength > 2 && nextSegment > 2)) {
                break;
            }
            index = next;
            segmentLength = 0;
        }
        return index;
    }

    private static int countWordChars(String text, int from) {
        int count = 0;
        int index = from;
        while (index < text.length() && isWordCodePoint(text.codePointAt(index))) {
            index += Character.charCount(text.codePointAt(index));
            count++;
        }
        return count;
    }

    /** Dựng Token từ đoạn văn bản gốc, trả về null nếu đoạn không chứa chữ hay số nào. */
    private static Token buildToken(String source, int start, int end, boolean punctuationGap) {
        boolean hadInvisible = source.codePoints().anyMatch(ProfanityUtils::isInvisible);
        String stripped = stripInvisible(source);
        String compatible = Normalizer.normalize(stripped, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        String composed = Normalizer.normalize(stripped, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        String unmasked = replaceLookalikes(compatible);

        boolean foreignLatin = containsForeignLatin(unmasked);
        boolean obfuscated = hadInvisible || foreignLatin || !compatible.equals(composed)
                || !unmasked.equals(compatible);
        if (foreignLatin) {
            unmasked = fold(unmasked);
        }

        boolean hasLetter = unmasked.codePoints().anyMatch(Character::isLetter);
        boolean hasDigit = unmasked.codePoints().anyMatch(Character::isDigit);
        boolean hasSymbol = unmasked.codePoints().anyMatch(ProfanityUtils::isLeetSymbol);
        if (!hasLetter && !hasDigit) {
            return null;
        }

        List<String> decoded = List.of();
        Pattern wildcard = null;
        if (hasLetter && (hasDigit || hasSymbol) && isDecodable(unmasked)) {
            String foldedSource = fold(unmasked);
            decoded = decodeLeet(foldedSource);
            wildcard = unmasked.indexOf('*') >= 0 ? buildWildcard(foldedSource) : null;
            obfuscated = true;
        }

        String exact = collapseRuns(unmasked, false);
        String shortened = collapseRuns(unmasked, true);
        String folded = fold(exact);
        String foldedShort = fold(shortened);
        boolean plain = exact.equals(folded);
        boolean numeric = hasDigit && !hasLetter && !hasSymbol;
        return new Token(start, end, exact, shortened, folded, foldedShort, plain, obfuscated,
                decoded, wildcard, isAllUpperCase(stripped), numeric, punctuationGap);
    }

    private static String stripInvisible(String source) {
        StringBuilder builder = new StringBuilder(source.length());
        source.codePoints()
                .filter(codePoint -> !isInvisible(codePoint) && !(codePoint >= 0xFE00 && codePoint <= 0xFE0F))
                .forEach(builder::appendCodePoint);
        return builder.toString();
    }

    /** Thay ký tự giả dạng thành chữ Latin nếu từ chỉ gồm chữ Latin và ký tự giả dạng; từ Kirin thật được giữ nguyên. */
    private static String replaceLookalikes(String text) {
        boolean hasLookalike = false;
        for (char character : text.toCharArray()) {
            if (LOOKALIKES.containsKey(character)) {
                hasLookalike = true;
            } else if (Character.isLetter(character)
                    && Character.UnicodeScript.of(character) != Character.UnicodeScript.LATIN) {
                return text;
            }
        }
        if (!hasLookalike) {
            return text;
        }
        StringBuilder builder = new StringBuilder(text.length());
        for (char character : text.toCharArray()) {
            builder.append(LOOKALIKES.getOrDefault(character, character));
        }
        return builder.toString();
    }

    /** Chữ Latin có dấu ngoài bảng chữ tiếng Việt ("fück", "shït") là dấu hiệu giả dạng. */
    private static boolean containsForeignLatin(String text) {
        for (char character : text.toCharArray()) {
            if (character > 127 && Character.isLetter(character)
                    && Character.UnicodeScript.of(character) == Character.UnicodeScript.LATIN
                    && VIETNAMESE_LETTERS.indexOf(character) < 0) {
                return true;
            }
        }
        return false;
    }

    private static boolean isDecodable(String text) {
        return text.codePointCount(0, text.length()) >= 3
                && !NUMBER_WITH_UNIT_PATTERN.matcher(text).matches()
                && !SHORT_CODE_PATTERN.matcher(text).matches();
    }

    /** Giải mã leetspeak ("l0n", "c@c", "sh1t"); số 1 có thể là chữ i hoặc l nên sinh cả hai dạng. */
    private static List<String> decodeLeet(String folded) {
        List<StringBuilder> forms = new ArrayList<>();
        forms.add(new StringBuilder());
        for (char character : folded.toCharArray()) {
            String replacements = leetReplacements(character);
            if (replacements == null) {
                forms.forEach(form -> form.append(character));
            } else if (replacements.length() == 1 || forms.size() * 2 > MAX_DECODED_FORMS) {
                forms.forEach(form -> form.append(replacements.charAt(0)));
            } else {
                List<StringBuilder> alternatives = new ArrayList<>();
                for (StringBuilder form : forms) {
                    alternatives.add(new StringBuilder(form).append(replacements.charAt(1)));
                    form.append(replacements.charAt(0));
                }
                forms.addAll(alternatives);
            }
        }
        Set<String> decoded = new LinkedHashSet<>();
        for (StringBuilder form : forms) {
            String value = form.toString();
            decoded.add(collapseRuns(value, false));
            decoded.add(collapseRuns(value, true));
        }
        return List.copyOf(decoded);
    }

    private static String leetReplacements(char character) {
        return switch (character) {
            case '0' -> "o";
            case '1' -> "il";
            case '3' -> "e";
            case '4', '@' -> "a";
            case '5', '$' -> "s";
            case '7', '+' -> "t";
            case '!' -> "i";
            case '|' -> "l";
            default -> null;
        };
    }

    /** Dựng mẫu khớp cho từ tự che bằng dấu sao, cần ít nhất hai chữ cái để không đoán quá rộng. */
    private static Pattern buildWildcard(String folded) {
        long letters = folded.chars().filter(Character::isLetter).count();
        if (letters < 2) {
            return null;
        }
        StringBuilder regex = new StringBuilder("^");
        for (char character : folded.toCharArray()) {
            if (character == '*') {
                regex.append('.');
            } else {
                regex.append(Pattern.quote(String.valueOf(character)));
            }
        }
        return Pattern.compile(regex.append('$').toString());
    }

    /**
     * Rút gọn ký tự lặp theo mã ký tự, giữ nguyên dấu tiếng Việt.
     * Tiếng Việt không có phụ âm đôi nên ở chế độ rút hết, phụ âm lặp còn một; nguyên âm chỉ rút khi lặp từ 3 lần
     * vì "uu", "oo" là cách viết không dấu hợp lệ của "cựu", "xoong".
     */
    private static String collapseRuns(String text, boolean shortenDoubles) {
        StringBuilder builder = new StringBuilder(text.length());
        int[] codePoints = text.codePoints().toArray();
        int index = 0;
        while (index < codePoints.length) {
            int codePoint = codePoints[index];
            int run = 1;
            while (index + run < codePoints.length && codePoints[index + run] == codePoint) {
                run++;
            }
            int keep = run;
            if (shortenDoubles) {
                if (run >= 3 || (run == 2 && Character.isLetter(codePoint) && !isVowel(codePoint))) {
                    keep = 1;
                }
            } else if (run >= 3) {
                keep = 2;
            }
            for (int i = 0; i < keep; i++) {
                builder.appendCodePoint(codePoint);
            }
            index += run;
        }
        return builder.toString();
    }

    private static boolean isVowel(int codePoint) {
        String base = fold(new String(Character.toChars(codePoint)));
        return !base.isEmpty() && "aeiouy".indexOf(base.charAt(0)) >= 0;
    }

    private static boolean isAllUpperCase(String text) {
        boolean sawLetter = false;
        for (int index = 0; index < text.length(); ) {
            int codePoint = text.codePointAt(index);
            if (Character.isLowerCase(codePoint)) {
                return false;
            }
            sawLetter |= Character.isUpperCase(codePoint);
            index += Character.charCount(codePoint);
        }
        return sawLetter;
    }
}
