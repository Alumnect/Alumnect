package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.common.enums.SalaryAnomalyStatus;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.salary.SalaryContributionRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.salary.SalaryAiCheckRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryAiCheckResponse;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.gemini.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Cài đặt A1. Nguyên tắc: Gemini CHỈ ước lượng dải lương thị trường; % bất thường và quyết định chặn luôn do backend
 * tính tất định từ dải đó. Dải do model trả về bị loại nếu vô lý (sai thứ tự, lệch &gt; 3 lần so với bảng tham chiếu
 * cục bộ) và khi Gemini lỗi/timeout thì dùng thẳng {@link SalaryMarketReference} — luôn có kết quả, không ném lỗi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SalaryAiServiceImpl implements SalaryAiService {

    /** Vượt trần thị trường quá ngưỡng này (%) → chặn cứng. */
    static final int BLOCK_THRESHOLD_PERCENT = 150;
    /** Vượt trần thị trường (> ngưỡng này, %) nhưng chưa tới ngưỡng chặn → cảnh báo vàng, cần xác nhận (theo đặc tả: 0% < lệch ≤ 150%). */
    static final int WARN_THRESHOLD_PERCENT = 0;
    /** Thấp hơn mức này × mức tối thiểu thị trường → cảnh báo (nghi gõ thiếu số 0). */
    static final double LOW_WARN_RATIO = 0.4;
    /** Model được phép lệch tối đa bấy nhiêu lần so với trung vị tham chiếu cục bộ. */
    static final double MODEL_DEVIATION_LIMIT = 3.0;
    /** Cần ít nhất bấy nhiêu mẫu nội bộ để coi là có dữ liệu. */
    private static final long MIN_INTERNAL_SAMPLES = 3;

    private static final Set<String> LEVELS = Set.of("Junior", "Mid", "Senior");

    private static final String SYSTEM_INSTRUCTION = """
            Bạn là chuyên gia khảo sát lương thị trường Việt Nam. Hãy ước lượng dải lương GỘP (Gross) HÀNG THÁNG, đơn vị VNĐ, \
            phổ biến cho vị trí được mô tả (mặt bằng 2025-2026). Trả về DUY NHẤT một JSON hợp lệ, không giải thích:
            {"marketMinVnd":0,"marketMedianVnd":0,"marketMaxVnd":0,"noteVi":""}
            QUY TẮC: các số là SỐ NGUYÊN VNĐ/tháng (VD 35 triệu = 35000000), marketMinVnd < marketMedianVnd < marketMaxVnd; \
            min = mức thấp phổ biến (khoảng P10), max = mức cao phổ biến (khoảng P90, không phải ngoại lệ hiếm), \
            chú ý cấp bậc/số năm kinh nghiệm, khu vực (Hà Nội/TP.HCM cao nhất, Đà Nẵng và tỉnh thấp hơn 10-20%) và lịch sử \
            công việc nếu được cung cấp. noteVi: đúng 1 câu tiếng Việt (≤ 160 ký tự) nêu yếu tố chính ảnh hưởng mức lương \
            (VD kỹ năng, ngành, quy mô công ty), TUYỆT ĐỐI KHÔNG nhắc con số cụ thể nào của người dùng.
            """;

    private final GeminiClient geminiClient;
    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final IndustryRepository industryRepository;
    private final SalaryContributionRepository salaryContributionRepository;

    // ------------------------------------------------------------------ A1.1 kiểm tra & chặn

    @Override
    public SalaryAiCheckResponse checkSalary(String email, SalaryAiCheckRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase(Locale.ROOT) : "";
        if (!role.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ cựu sinh viên mới được đóng góp dữ liệu lương");
        }

        String jobTitle = request.getJobTitle().trim();
        List<Experience> experiences = experienceRepository.findByUserIdOrderByStartDateDesc(user.getId());
        Short years = request.getYearsExperience() != null ? request.getYearsExperience() : estimateYears(experiences);
        String city = blankToNull(request.getLocationCity());
        String region = blankToNull(request.getRegion());
        long amount = request.getGrossAmount().setScale(0, java.math.RoundingMode.HALF_UP).longValue();

        SalaryMarketReference.Range local = SalaryMarketReference.lookup(jobTitle, years, city, region);
        Optional<SalaryAiModelOutput> ai = askGemini(jobTitle, request.getCompany(), city, region, years, experiences);
        SalaryMarketReference.Range market = local;
        String note = null;
        boolean fromGemini = false;
        if (ai.isPresent() && isSane(ai.get(), local)) {
            SalaryAiModelOutput o = ai.get();
            market = new SalaryMarketReference.Range(o.getMarketMinVnd(), o.getMarketMedianVnd(), o.getMarketMaxVnd());
            note = blankToNull(o.getNoteVi());
            fromGemini = true;
        }

        InternalStats internal = loadInternal(request.getIndustryId(), city != null ? city : region, jobTitle, years);

        int anomaly = anomalyPercent(amount, market.max());
        SalaryAnomalyStatus status;
        if (anomaly > BLOCK_THRESHOLD_PERCENT) {
            status = SalaryAnomalyStatus.EXCESSIVE_ANOMALY_BLOCKED;
        } else if (anomaly > WARN_THRESHOLD_PERCENT) {
            status = SalaryAnomalyStatus.HIGH_ANOMALY_ALLOWED;
        } else if (amount < market.min() * LOW_WARN_RATIO) {
            status = SalaryAnomalyStatus.BELOW_MARKET_WARNING;
        } else {
            status = SalaryAnomalyStatus.NORMAL;
        }
        boolean blocked = status == SalaryAnomalyStatus.EXCESSIVE_ANOMALY_BLOCKED;
        boolean needConfirm = status == SalaryAnomalyStatus.HIGH_ANOMALY_ALLOWED
                || status == SalaryAnomalyStatus.BELOW_MARKET_WARNING;

        Long suggestion = status == SalaryAnomalyStatus.NORMAL ? null : suggestCorrection(amount, market);

        SalaryAiCheckResponse response = SalaryAiCheckResponse.builder()
                .anomalyPercentage(anomaly)
                .isBlocked(blocked)
                .requiresConfirmation(needConfirm)
                .status(status)
                .suggestedCorrectedAmountVnd(suggestion)
                .realMarketRange(SalaryAiCheckResponse.MarketRange.builder()
                        .minVnd(market.min()).medianVnd(market.median()).maxVnd(market.max())
                        .percentileEstimate(estimatePercentile(amount, market))
                        .build())
                .alumnectInternalRange(SalaryAiCheckResponse.InternalRange.builder()
                        .minVnd(internal.min).medianVnd(internal.median).maxVnd(internal.max)
                        .sampleCount(internal.count)
                        .build())
                .marketComparisonVi(buildComparison(jobTitle, years, city, region, amount, market, note))
                .advisoryMessageVi(buildAdvisory(status, anomaly, amount, market, suggestion))
                .source(fromGemini ? "GEMINI" : "LOCAL_FALLBACK")
                .build();
        log.info("AI Salary [A1]: status={}, anomaly={}%, blocked={}, source={}", status, anomaly, blocked, response.getSource());
        return response;
    }

    // ------------------------------------------------------------------ tính toán tất định

    /** % lệch so với TRẦN thị trường; 0 nếu không vượt trần. */
    static int anomalyPercent(long amount, long marketMax) {
        if (marketMax <= 0 || amount <= marketMax) {
            return 0;
        }
        double pct = (amount - marketMax) * 100.0 / marketMax;
        return (int) Math.min(Integer.MAX_VALUE, Math.round(pct));
    }

    /**
     * Gợi ý sửa nhanh: ưu tiên "dịch dấu phẩy" (÷/× 10, 100, 1000) nếu kết quả nằm trong dải thị trường, nếu không thì
     * dùng trung vị thị trường làm tròn 500.000.
     */
    static Long suggestCorrection(long amount, SalaryMarketReference.Range market) {
        if (amount <= 0) {
            return roundTo500k(market.median());
        }
        long[] factors = {10, 100, 1000};
        for (long f : factors) {
            long candidate = amount > market.max() ? Math.round(amount / (double) f) : amount * f;
            if (candidate >= market.min() && candidate <= market.max()) {
                return roundTo500k(candidate);
            }
        }
        return roundTo500k(market.median());
    }

    private static long roundTo500k(long v) {
        long r = Math.round(v / 500_000.0) * 500_000L;
        return Math.max(r, 500_000L);
    }

    /** Phân vị ước lượng: min→P10, median→P50, max→P90, nội suy tuyến tính, kẹp trong 1..99. */
    static int estimatePercentile(long amount, SalaryMarketReference.Range m) {
        double p;
        if (amount <= m.min()) {
            p = m.min() <= 0 ? 1 : 10.0 * amount / m.min();
        } else if (amount <= m.median()) {
            p = 10 + 40.0 * (amount - m.min()) / Math.max(1, m.median() - m.min());
        } else if (amount <= m.max()) {
            p = 50 + 40.0 * (amount - m.median()) / Math.max(1, m.max() - m.median());
        } else {
            p = 90 + Math.min(9.0, 9.0 * (amount - m.max()) / Math.max(1.0, m.max()));
        }
        return (int) Math.max(1, Math.min(99, Math.round(p)));
    }

    /** Dải model hợp lệ: dương, đúng thứ tự, trung vị không lệch quá {@link #MODEL_DEVIATION_LIMIT} lần so với tham chiếu cục bộ. */
    static boolean isSane(SalaryAiModelOutput o, SalaryMarketReference.Range local) {
        if (o.getMarketMinVnd() == null || o.getMarketMedianVnd() == null || o.getMarketMaxVnd() == null) {
            return false;
        }
        long min = o.getMarketMinVnd();
        long med = o.getMarketMedianVnd();
        long max = o.getMarketMaxVnd();
        if (min <= 0 || med < min || max < med) {
            return false;
        }
        double ratio = med / (double) local.median();
        return ratio >= 1.0 / MODEL_DEVIATION_LIMIT && ratio <= MODEL_DEVIATION_LIMIT;
    }

    // ------------------------------------------------------------------ dữ liệu phụ trợ

    private record InternalStats(Long min, Long median, Long max, long count) {
    }

    private InternalStats loadInternal(Long industryId, String regionText, String jobTitle, Short years) {
        String level = years == null ? null : (years < 2 ? "Junior" : years <= 5 ? "Mid" : "Senior");
        String titlePattern = likePattern(jobTitle);
        String regionPattern = regionText == null ? null : likePattern(regionText);
        // Nới lỏng dần bộ lọc: (chức danh + cấp bậc + khu vực) → (chức danh + cấp bậc) → (chức danh).
        boolean[][] attempts = {
                {level != null, regionPattern != null},
                {level != null, false},
                {false, false}
        };
        InternalStats best = new InternalStats(null, null, null, 0);
        for (boolean[] a : attempts) {
            if (a[1] && regionPattern == null) {
                continue;
            }
            try {
                List<Object[]> rows = salaryContributionRepository.findInternalRangeVnd(
                        industryId != null, industryId,
                        a[1], a[1] ? regionPattern : "%",
                        true, titlePattern,
                        a[0], a[0] ? level : "Junior");
                if (rows == null || rows.isEmpty() || rows.get(0) == null) {
                    continue;
                }
                Object[] r = rows.get(0);
                long count = r[3] == null ? 0 : ((Number) r[3]).longValue();
                if (count == 0) {
                    continue;
                }
                best = new InternalStats(toLong(r[0]), toLong(r[1]), toLong(r[2]), count);
                if (count >= MIN_INTERNAL_SAMPLES) {
                    return best;
                }
            } catch (Exception ex) {
                log.warn("AI Salary [A1]: không đọc được dải lương nội bộ: {}", ex.getMessage());
            }
        }
        return best;
    }

    private static Long toLong(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof BigDecimal bd) {
            return bd.setScale(0, java.math.RoundingMode.HALF_UP).longValue();
        }
        return Math.round(((Number) o).doubleValue());
    }

    private static String likePattern(String raw) {
        String escaped = raw.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    /** Ước lượng số năm kinh nghiệm từ lịch sử công việc (từ ngày bắt đầu sớm nhất đến nay); null nếu không có. */
    static Short estimateYears(List<Experience> experiences) {
        if (experiences == null || experiences.isEmpty()) {
            return null;
        }
        LocalDate earliest = null;
        for (Experience e : experiences) {
            if (e.getStartDate() != null && (earliest == null || e.getStartDate().isBefore(earliest))) {
                earliest = e.getStartDate();
            }
        }
        if (earliest == null) {
            return null;
        }
        long y = ChronoUnit.YEARS.between(earliest, LocalDate.now());
        return (short) Math.max(0, Math.min(60, y));
    }

    private static Short levelToYears(String level) {
        if (level == null) {
            return null;
        }
        return switch (level) {
            case "Junior" -> (short) 1;
            case "Mid" -> (short) 4;
            default -> (short) 8;
        };
    }

    private Optional<SalaryAiModelOutput> askGemini(String jobTitle, String company, String city, String region, Short years,
                                                    List<Experience> experiences) {
        StringBuilder sb = new StringBuilder("Vị trí: ").append(jobTitle);
        if (company != null && !company.isBlank()) {
            sb.append("\nCông ty: ").append(company.trim());
        }
        String where = city != null ? city : region;
        sb.append("\nKhu vực: ").append(where != null ? where : "không rõ (giả định Hà Nội/TP.HCM)");
        sb.append("\nSố năm kinh nghiệm: ").append(years != null ? years : "không rõ");
        if (experiences != null && !experiences.isEmpty()) {
            sb.append("\nLịch sử công việc của người dùng:");
            int n = 0;
            for (Experience e : experiences) {
                if (n++ >= 6) {
                    break;
                }
                sb.append("\n- ").append(e.getTitle() == null ? "?" : e.getTitle())
                        .append(" tại ").append(e.getCompany() == null ? "?" : e.getCompany())
                        .append(" (").append(e.getStartDate() == null ? "?" : e.getStartDate().getYear())
                        .append(" - ").append(e.isCurrent() || e.getEndDate() == null ? "nay" : String.valueOf(e.getEndDate().getYear()))
                        .append(')');
            }
        }
        try {
            return geminiClient.generateStructured(SYSTEM_INSTRUCTION, sb.toString(), SalaryAiModelOutput.class);
        } catch (Exception ex) {
            log.warn("AI Salary [A1]: Gemini lỗi, dùng bảng tham chiếu cục bộ: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    // ------------------------------------------------------------------ văn bản (tất định, khớp quyết định)

    static String fmtMillion(long vnd) {
        double m = vnd / 1_000_000.0;
        if (Math.abs(m - Math.rint(m)) < 0.05) {
            return (long) Math.rint(m) + " triệu";
        }
        return String.format(Locale.ROOT, "%.1f", m).replace('.', ',') + " triệu";
    }

    static String fmtRange(long min, long max) {
        String a = fmtMillion(min);
        String b = fmtMillion(max);
        return a.replace(" triệu", "") + " - " + b + "/tháng";
    }

    static String fmtVnd(long v) {
        String s = Long.toString(Math.abs(v));
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            if (i > 0 && (s.length() - i) % 3 == 0) {
                sb.append('.');
            }
            sb.append(s.charAt(i));
        }
        return (v < 0 ? "-" : "") + sb + " VNĐ";
    }

    private static String buildComparison(String jobTitle, Short years, String city, String region, long amount,
                                          SalaryMarketReference.Range m, String note) {
        int band = SalaryMarketReference.bandOf(years);
        String where = city != null ? city : region;
        StringBuilder sb = new StringBuilder("Mặt bằng thị trường cho ").append(jobTitle).append(" (")
                .append(SalaryMarketReference.bandLabel(band)).append(where != null ? ", " + where : "")
                .append(") phổ biến ").append(fmtRange(m.min(), m.max()))
                .append(", trung vị khoảng ").append(fmtMillion(m.median())).append(". Mức bạn nhập (")
                .append(fmtMillion(amount)).append(") ");
        int p = estimatePercentile(amount, m);
        if (amount > m.max()) {
            sb.append("vượt trần thị trường phổ biến.");
        } else if (amount < m.min()) {
            sb.append("thấp hơn mức tối thiểu phổ biến.");
        } else {
            sb.append("nằm quanh phân vị P").append(p).append(" của thị trường.");
        }
        if (note != null) {
            sb.append(' ').append(note);
        }
        return sb.toString();
    }

    private static String buildAdvisory(SalaryAnomalyStatus status, int anomaly, long amount,
                                        SalaryMarketReference.Range m, Long suggestion) {
        String hint = suggestion != null ? " Gợi ý: " + fmtMillion(suggestion) + " (" + fmtVnd(suggestion) + ")." : "";
        return switch (status) {
            case NORMAL -> "Mức lương hợp lý so với thị trường. Cảm ơn bạn đã đóng góp dữ liệu!";
            case BELOW_MARKET_WARNING -> "Mức lương " + fmtVnd(amount) + " thấp hơn nhiều so với mặt bằng ("
                    + fmtRange(m.min(), m.max()) + "). Bạn có gõ thiếu chữ số 0 không?" + hint
                    + " Nếu đúng là mức lương thực tế, bạn vẫn có thể xác nhận gửi.";
            case HIGH_ANOMALY_ALLOWED -> "Mức lương cao hơn trần thị trường " + anomaly + "%. Nếu đúng là lương thực nhận "
                    + "(VD thưởng lớn, vị trí đặc thù) bạn có thể xác nhận gửi; nếu nhầm số, hãy sửa lại." + hint;
            case EXCESSIVE_ANOMALY_BLOCKED -> "Mức lương " + fmtVnd(amount) + " cao hơn trần thị trường " + anomaly
                    + "% — quá bất thường nên không thể đăng để bảo vệ chất lượng dữ liệu. Bạn có nhập dư chữ số 0 không?" + hint;
        };
    }
}
