package com.alumnect.alumnect_backend.service.careerpath;

import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Phần tất định của C2: dựng "nấc thang" lịch sử từ {@code experiences}, tính các dữ kiện (số năm, số công ty, bước ngoặt
 * lên quản lý), nhận diện "Sếp lớn" và phân loại quan hệ EXECUTIVE_LEADER / PEER_OR_SENIOR / CROSS_INDUSTRY. Không phụ
 * thuộc Spring/JPA nên kiểm thử độc lập được; Gemini chỉ viết lời nhận xét dựa trên các dữ kiện này.
 */
final class CareerAiSupport {

    private CareerAiSupport() {
    }

    /** Một bản ghi kinh nghiệm thô (đã tách khỏi entity). */
    record Exp(String title, String company, LocalDate start, LocalDate end, boolean current) {
    }

    /** Một nấc thang đã gộp các vị trí liên tiếp trong cùng công ty. */
    record Step(String period, String title, String company, LocalDate start, LocalDate end, boolean current,
                boolean leadership) {
    }

    record Profile(Long userId, String name, String avatarUrl, String headline, String major, Integer cohort,
                   Integer graduationYear, List<String> skills, List<Exp> exps) {
    }

    record Facts(List<Step> ladder, int companyCount, Integer yearsSinceFirstJob, Integer yearsToCurrentRole,
                 String turningPoint, String currentTitle, String currentCompany, boolean executive) {
    }

    enum Domain {
        TECH("Công nghệ thông tin"),
        FINANCE("Tài chính - Ngân hàng"),
        MARKETING("Marketing - Truyền thông"),
        DESIGN("Thiết kế - Sáng tạo"),
        BUSINESS("Kinh doanh - Quản trị"),
        OTHER("một ngành khác"),
        UNKNOWN("ngành của bạn");

        final String label;

        Domain(String label) {
            this.label = label;
        }
    }

    // ------------------------------------------------------------------ chuẩn hóa & từ khóa

    private static String norm(String s) {
        String r = VietnameseStringUtils.removeAccents(s == null ? "" : s);
        return " " + (r == null ? "" : r.replaceAll("[^a-z0-9]+", " ").trim()) + " ";
    }

    private static boolean hasAny(String n, String... words) {
        for (String w : words) {
            if (n.contains(" " + w + " ")) {
                return true;
            }
        }
        return false;
    }

    static boolean isExecutive(String title) {
        String n = norm(title);
        return hasAny(n, "cto", "ceo", "cfo", "coo", "cio", "cmo", "ciso", "chief", "director", "founder", "co founder",
                "cofounder", "vp", "svp", "evp", "vice president", "president", "head of", "managing director",
                "general manager", "giam doc", "pho giam doc", "tong giam doc", "chu tich", "chu doanh nghiep");
    }

    static boolean isLeadership(String title) {
        if (isExecutive(title)) {
            return true;
        }
        String n = norm(title);
        return hasAny(n, "lead", "leader", "manager", "head", "supervisor", "quan ly", "truong phong", "truong nhom",
                "truong bo phan", "truong khoi", "truong ban", "scrum master", "team lead", "tech lead", "principal");
    }

    private static final String[][] DOMAIN_WORDS = {
            // TECH
            {"software", "developer", "development", "dev", "engineer", "programmer", "coding", "backend", "frontend",
                    "fullstack", "devops", "tester", "qa", "qc", "data", "ai", "ml", "it", "cloud", "cybersecurity",
                    "security", "network", "java", "python", "react", "sql", "nodejs", "mobile", "android", "ios", "web",
                    "technology", "technical", "architect", "solutions architect", "system architect", "system design",
                    "cong nghe thong tin", "phan mem", "lap trinh", "tri tue nhan tao",
                    "an toan thong tin", "he thong thong tin", "cntt", "information technology", "computer science"},
            // FINANCE
            {"finance", "financial", "bank", "banking", "accountant", "accounting", "audit", "auditor", "tax",
                    "investment", "tai chinh", "ngan hang", "ke toan", "kiem toan", "dau tu", "bao hiem", "chung khoan",
                    "credit", "tin dung"},
            // MARKETING
            {"marketing", "seo", "sem", "content", "copywriter", "brand", "pr", "public relations", "truyen thong",
                    "quan he cong chung", "quang cao", "social media", "digital", "ecommerce", "e commerce",
                    "thuong mai dien tu", "koc", "kol"},
            // DESIGN
            {"design", "designer", "ui", "ux", "graphic", "creative", "thiet ke", "my thuat", "animator", "motion",
                    "3d", "illustrator", "art director"},
            // BUSINESS
            {"business", "sales", "kinh doanh", "quan tri", "logistics", "supply chain", "xuat nhap khau", "import",
                    "export", "procurement", "mua hang", "operations", "van hanh", "account manager",
                    "product manager", "project manager", "customer success", "pm", "bd", "bde"},
            // OTHER
            {"nhan su", "hr", "recruiter", "luat", "legal", "giao duc", "giang vien", "teacher", "du lich", "khach san",
                    "hotel", "tourism", "ngon ngu", "translator", "bien dich", "phien dich", "tieng"}
    };
    private static final Domain[] DOMAIN_ORDER = {Domain.TECH, Domain.FINANCE, Domain.MARKETING, Domain.DESIGN,
            Domain.BUSINESS, Domain.OTHER};

    static Domain detectDomain(String text) {
        String n = norm(text);
        int best = 0;
        Domain result = Domain.UNKNOWN;
        for (int i = 0; i < DOMAIN_WORDS.length; i++) {
            int score = 0;
            for (String w : DOMAIN_WORDS[i]) {
                if (n.contains(" " + w + " ")) {
                    score++;
                }
            }
            if (score > best) {
                best = score;
                result = DOMAIN_ORDER[i];
            }
        }
        return result;
    }

    // ------------------------------------------------------------------ nấc thang

    private static final class Builder {
        final List<String> titles = new ArrayList<>();
        String company;
        LocalDate start;
        LocalDate end;
        boolean current;

        void addTitle(String t) {
            String clean = t == null ? "" : t.trim();
            if (clean.isEmpty()) {
                return;
            }
            if (titles.isEmpty() || !titles.get(titles.size() - 1).equalsIgnoreCase(clean)) {
                titles.add(clean);
            }
        }
    }

    static String durationText(LocalDate from, LocalDate to) {
        long months = Math.max(0, ChronoUnit.MONTHS.between(from, to));
        if (months >= 12) {
            return Math.round(months / 12.0) + " năm";
        }
        return Math.max(1, months) + " tháng";
    }

    static List<Step> buildLadder(List<Exp> exps, LocalDate today) {
        List<Exp> sorted = new ArrayList<>();
        for (Exp e : exps) {
            if (e != null && e.start() != null) {
                sorted.add(e);
            }
        }
        sorted.sort(Comparator.comparing(Exp::start));
        List<Builder> builders = new ArrayList<>();
        for (Exp e : sorted) {
            String company = e.company() == null ? "" : e.company().trim();
            Builder last = builders.isEmpty() ? null : builders.get(builders.size() - 1);
            boolean isCurrent = e.current() || e.end() == null;
            if (last != null && !company.isEmpty() && company.equalsIgnoreCase(last.company == null ? "" : last.company)) {
                last.addTitle(e.title());
                if (isCurrent) {
                    last.current = true;
                    last.end = null;
                } else if (!last.current && (last.end == null || e.end().isAfter(last.end))) {
                    last.end = e.end();
                }
            } else {
                Builder b = new Builder();
                b.company = company;
                b.start = e.start();
                b.current = isCurrent;
                b.end = isCurrent ? null : e.end();
                b.addTitle(e.title());
                builders.add(b);
            }
        }
        List<Step> steps = new ArrayList<>();
        for (Builder b : builders) {
            String period;
            if (b.current) {
                period = b.start.getYear() + " - Nay";
            } else {
                LocalDate end = b.end != null ? b.end : today;
                period = b.start.getYear() + " - " + end.getYear() + " (" + durationText(b.start, end) + ")";
            }
            boolean lead = false;
            for (String t : b.titles) {
                lead |= isLeadership(t);
            }
            steps.add(new Step(period, String.join(" -> ", b.titles), b.company, b.start, b.end, b.current, lead));
        }
        return steps;
    }

    static Facts analyze(Profile p, LocalDate today) {
        List<Exp> sorted = new ArrayList<>();
        for (Exp e : p.exps()) {
            if (e != null && e.start() != null) {
                sorted.add(e);
            }
        }
        sorted.sort(Comparator.comparing(Exp::start));
        List<Step> ladder = buildLadder(sorted, today);
        if (sorted.isEmpty()) {
            return new Facts(ladder, 0, null, null, null, null, null, false);
        }
        Set<String> companies = new LinkedHashSet<>();
        for (Exp e : sorted) {
            if (e.company() != null && !e.company().isBlank()) {
                companies.add(e.company().trim().toLowerCase(Locale.ROOT));
            }
        }
        LocalDate first = sorted.get(0).start();
        // Vị trí hiện tại: ưu tiên bản ghi đang làm có ngày bắt đầu muộn nhất; không có thì bản ghi bắt đầu muộn nhất.
        Exp current = null;
        for (Exp e : sorted) {
            if ((e.current() || e.end() == null) && (current == null || !e.start().isBefore(current.start()))) {
                current = e;
            }
        }
        if (current == null) {
            current = sorted.get(sorted.size() - 1);
        }
        boolean executive = false;
        for (Exp e : sorted) {
            if ((e.current() || e.end() == null) && isExecutive(e.title())) {
                executive = true;
            }
        }
        if (!executive && isExecutive(current.title())) {
            executive = true;
        }
        int yearsSince = (int) Math.max(0, ChronoUnit.YEARS.between(first, today));
        int yearsTo = (int) Math.max(0, Math.round(ChronoUnit.MONTHS.between(first, current.start()) / 12.0));
        String turning = null;
        for (int i = 1; i < sorted.size(); i++) {
            Exp e = sorted.get(i);
            if (isLeadership(e.title())) {
                turning = "năm " + e.start().getYear() + " (lên " + e.title().trim()
                        + (e.company() == null || e.company().isBlank() ? "" : " tại " + e.company().trim()) + ")";
                break;
            }
        }
        return new Facts(ladder, companies.size(), yearsSince, yearsTo, turning, current.title(),
                current.company(), executive);
    }

    /** EXECUTIVE_LEADER | PEER_OR_SENIOR | CROSS_INDUSTRY — phân loại tất định, không giao cho model. */
    static String classify(Profile viewer, Facts viewerFacts, Profile target, Facts targetFacts) {
        if (targetFacts.executive()) {
            return "EXECUTIVE_LEADER";
        }
        Domain vd = viewerDomain(viewer);
        Domain td = targetDomain(target);
        if (vd != Domain.UNKNOWN && td != Domain.UNKNOWN && vd != td) {
            return "CROSS_INDUSTRY";
        }
        return "PEER_OR_SENIOR";
    }

    static Domain viewerDomain(Profile p) {
        StringBuilder sb = new StringBuilder();
        if (p.major() != null) {
            sb.append(p.major()).append(' ');
        }
        // 2 vị trí gần nhất phản ánh hướng đi hiện tại hơn toàn bộ lịch sử
        List<Exp> sorted = new ArrayList<>(p.exps());
        sorted.sort(Comparator.comparing(Exp::start, Comparator.nullsFirst(Comparator.naturalOrder())));
        for (int i = Math.max(0, sorted.size() - 2); i < sorted.size(); i++) {
            sb.append(sorted.get(i).title()).append(' ');
        }
        if (p.skills() != null) {
            sb.append(String.join(" ", p.skills()));
        }
        return detectDomain(sb.toString());
    }

    static Domain targetDomain(Profile p) {
        StringBuilder sb = new StringBuilder();
        for (Exp e : p.exps()) {
            sb.append(e.title()).append(' ');
        }
        if (p.headline() != null) {
            sb.append(p.headline()).append(' ');
        }
        if (p.skills() != null) {
            sb.append(String.join(" ", p.skills()));
        }
        Domain d = detectDomain(sb.toString());
        // Hồ sơ trống: dùng chuyên ngành làm mốc.
        return d == Domain.UNKNOWN && p.major() != null ? detectDomain(p.major()) : d;
    }
}
