package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;

/**
 * Bảng dải lương tham chiếu cục bộ cho thị trường Việt Nam (VNĐ gộp/tháng) — "Smart Local Fallback" của A1, đồng thời
 * là mốc đối chiếu để loại bỏ ước lượng vô lý của model. Chia theo nhóm nghề (IT &amp; kinh tế) × 4 bậc kinh nghiệm
 * (0 / 1-2 / 3-5 / 6+ năm), nhân hệ số vùng (HN/HCM = 1.0, Đà Nẵng ≈ 0.88, tỉnh khác ≈ 0.8).
 * Đây là số ước lượng mặt bằng chung, không phải dữ liệu chính thức.
 */
final class SalaryMarketReference {

    private SalaryMarketReference() {
    }

    record Range(long min, long median, long max) {
    }

    enum Family {
        IT_DEV("Lập trình / Kỹ sư phần mềm", new int[][]{{8, 12, 18}, {13, 20, 30}, {25, 38, 55}, {40, 60, 100}}),
        IT_DATA_AI("Dữ liệu / AI", new int[][]{{10, 14, 20}, {15, 24, 35}, {28, 42, 65}, {45, 70, 120}}),
        IT_QA("Kiểm thử phần mềm", new int[][]{{7, 10, 15}, {10, 16, 24}, {18, 28, 40}, {30, 42, 65}}),
        IT_BA_PM("Phân tích nghiệp vụ / Quản lý dự án", new int[][]{{8, 12, 17}, {13, 20, 30}, {25, 38, 55}, {40, 60, 100}}),
        IT_SUPPORT("Hạ tầng / Hỗ trợ CNTT", new int[][]{{6, 9, 13}, {9, 13, 20}, {15, 22, 32}, {25, 35, 55}}),
        DESIGN("Thiết kế", new int[][]{{7, 10, 15}, {10, 16, 24}, {18, 28, 40}, {30, 45, 70}}),
        MARKETING("Marketing / Truyền thông", new int[][]{{6, 9, 13}, {9, 14, 22}, {16, 25, 38}, {28, 40, 65}}),
        FINANCE("Tài chính / Kế toán / Ngân hàng", new int[][]{{7, 10, 14}, {10, 15, 22}, {16, 25, 38}, {28, 42, 70}}),
        SALES("Kinh doanh / Bán hàng", new int[][]{{6, 9, 14}, {9, 15, 25}, {16, 28, 45}, {30, 50, 90}}),
        HR_ADMIN("Nhân sự / Hành chính", new int[][]{{6, 9, 12}, {9, 13, 18}, {14, 20, 30}, {22, 32, 50}}),
        GENERAL("Vị trí chung", new int[][]{{6, 10, 14}, {9, 15, 22}, {15, 24, 36}, {25, 38, 65}});

        final String label;
        /** [bậc kinh nghiệm][min, median, max] — đơn vị triệu VNĐ, vùng HN/HCM. */
        final int[][] bands;

        Family(String label, int[][] bands) {
            this.label = label;
            this.bands = bands;
        }
    }

    /** Chuẩn hóa chuỗi để so khớp từ khóa (không dấu, chữ thường, bọc dấu cách hai đầu). */
    private static String norm(String s) {
        String r = VietnameseStringUtils.removeAccents(s == null ? "" : s);
        return " " + (r == null ? "" : r.replaceAll("[^a-z0-9+#]+", " ").trim()) + " ";
    }

    private static boolean has(String n, String... words) {
        for (String w : words) {
            if (n.contains(" " + w + " ") || n.contains(" " + w + "s ")) {
                return true;
            }
        }
        return false;
    }

    static Family detectFamily(String jobTitle) {
        String n = norm(jobTitle);
        if (has(n, "data", "ai", "machine learning", "ml", "du lieu", "bi")) {
            return Family.IT_DATA_AI;
        }
        if (has(n, "tester", "qa", "qc", "kiem thu", "test")) {
            return Family.IT_QA;
        }
        if (has(n, "devops", "sre", "network", "security", "system admin", "sysadmin", "helpdesk", "it support", "ha tang",
                "an ninh mang", "cloud")) {
            return Family.IT_SUPPORT;
        }
        if (has(n, "developer", "dev", "engineer", "programmer", "software", "backend", "back end", "frontend", "front end",
                "fullstack", "full stack", "java", "python", "php", "nodejs", "node", "react", "angular", "net", ".net", "c#",
                "c++", "golang", "mobile", "android", "ios", "flutter", "lap trinh", "ky su phan mem", "phan mem", "web")) {
            return Family.IT_DEV;
        }
        if (has(n, "designer", "design", "ui", "ux", "thiet ke", "graphic", "creative")) {
            return Family.DESIGN;
        }
        if (has(n, "business analyst", "ba", "product", "project", "scrum", "pm", "phan tich nghiep vu", "quan ly du an")) {
            return Family.IT_BA_PM;
        }
        if (has(n, "marketing", "seo", "content", "truyen thong", "digital", "brand", "social media", "pr")) {
            return Family.MARKETING;
        }
        if (has(n, "ke toan", "accountant", "accounting", "finance", "financial", "tai chinh", "ngan hang", "banker", "bank",
                "kiem toan", "audit", "tax", "thue", "investment", "dau tu", "risk", "credit", "tin dung")) {
            return Family.FINANCE;
        }
        if (has(n, "sales", "kinh doanh", "business development", "account manager", "ban hang", "sale")) {
            return Family.SALES;
        }
        if (has(n, "hr", "nhan su", "recruiter", "talent", "tuyen dung", "admin", "hanh chinh", "office")) {
            return Family.HR_ADMIN;
        }
        return Family.GENERAL;
    }

    /** 0 = dưới 1 năm, 1 = 1-2 năm, 2 = 3-5 năm, 3 = 6+ năm; -1 = chưa biết. */
    static int bandOf(Short years) {
        if (years == null) {
            return -1;
        }
        int y = years;
        if (y < 1) {
            return 0;
        }
        if (y <= 2) {
            return 1;
        }
        if (y <= 5) {
            return 2;
        }
        return 3;
    }

    static String bandLabel(int band) {
        return switch (band) {
            case 0 -> "mới ra trường / dưới 1 năm kinh nghiệm";
            case 1 -> "1-2 năm kinh nghiệm";
            case 2 -> "3-5 năm kinh nghiệm";
            case 3 -> "trên 5 năm kinh nghiệm";
            default -> "mọi cấp bậc";
        };
    }

    static double regionMultiplier(String city, String region) {
        String n = norm((city == null || city.isBlank() ? "" : city) + " " + (region == null ? "" : region));
        if (n.isBlank()) {
            return 1.0;
        }
        if (has(n, "ho chi minh", "hcm", "sai gon", "tphcm", "ha noi", "hanoi", "hn", "remote")) {
            return 1.0;
        }
        if (has(n, "da nang")) {
            return 0.88;
        }
        return 0.8;
    }

    /**
     * Dải tham chiếu (VNĐ) cho nhóm nghề + bậc kinh nghiệm + vùng. Bậc chưa biết (-1) → hợp nhất mọi bậc
     * (min của bậc thấp nhất … max của bậc cao nhất) để không chặn oan người chưa khai số năm kinh nghiệm.
     */
    static Range lookup(Family family, int band, double regionMultiplier) {
        double min;
        double med;
        double max;
        if (band < 0) {
            min = family.bands[0][0];
            max = family.bands[3][2];
            med = family.bands[2][1];
        } else {
            min = family.bands[band][0];
            med = family.bands[band][1];
            max = family.bands[band][2];
        }
        return new Range(Math.round(min * regionMultiplier * 1_000_000L),
                Math.round(med * regionMultiplier * 1_000_000L),
                Math.round(max * regionMultiplier * 1_000_000L));
    }

    static Range lookup(String jobTitle, Short years, String city, String region) {
        return lookup(detectFamily(jobTitle), bandOf(years), regionMultiplier(city, region));
    }
}
