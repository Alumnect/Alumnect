package com.alumnect.alumnect_backend.service.careerpath;

import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Domain;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Facts;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Profile;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Step;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Smart Local Fallback của C2: Soạn nội dung phân tích (tóm tắt, nhận xét từng nấc, điểm chung, khoảng cách năng lực,
 * kỹ năng đòn bẩy, lời khuyên hành động) sắc sảo, tự nhiên, mang tính định hướng cao như một Tech Lead / Mentor kỳ cựu
 * khi Gemini lỗi/timeout, đảm bảo không bao giờ bị khô khan hay máy móc.
 */
final class CareerAiLocalComposer {

    private CareerAiLocalComposer() {
    }

    static CareerAiModelOutput compose(Profile viewer, Facts vf, Profile target, Facts tf, String relationship) {
        boolean viewerEmpty = vf.ladder().isEmpty();
        Domain vd = CareerAiSupport.viewerDomain(viewer);
        Domain td = CareerAiSupport.targetDomain(target);

        CareerAiModelOutput out = new CareerAiModelOutput();
        out.setComparisonSummaryVi(summary(viewer, vf, target, tf, relationship, viewerEmpty, vd, td));
        out.setLadderTakeawaysVi(ladderTakeaways(tf));
        out.setSharedStrengths(sharedStrengths(viewer, target, vd, td));
        out.setKeyGapsToBridge(gaps(viewer, vf, target, tf, relationship, viewerEmpty, td));
        out.setTransferableSkills(transferable(viewer, target, relationship, vd));
        out.setActionableAdviceVi(advice(viewer, vf, target, tf, relationship, viewerEmpty, td));
        return out;
    }

    // ------------------------------------------------------------------ helpers

    private static String name(Profile p) {
        return p.name() == null || p.name().isBlank() ? "Cựu sinh viên này" : p.name().trim();
    }

    private static String cohortText(Profile p) {
        return p.cohort() == null ? "" : " (K" + p.cohort() + " FPTU)";
    }

    private static String atCompany(String company) {
        return company == null || company.isBlank() ? "" : " tại " + company.trim();
    }

    private static String currentRoleText(Facts f) {
        if (f.currentTitle() == null) {
            return "";
        }
        return f.currentTitle().trim() + atCompany(f.currentCompany());
    }

    private static String firstStepText(Facts f) {
        if (f.ladder().isEmpty()) {
            return "";
        }
        Step s = f.ladder().get(0);
        return s.title() + atCompany(s.company());
    }

    private static String viewerContext(Profile viewer, Facts vf) {
        if (!vf.ladder().isEmpty() && vf.currentTitle() != null) {
            return "bạn hiện là " + vf.currentTitle().trim() + atCompany(vf.currentCompany());
        }
        if (viewer.major() != null && !viewer.major().isBlank()) {
            return "bạn đang học ngành " + viewer.major().trim();
        }
        return "bạn đang ở giai đoạn đầu sự nghiệp";
    }

    private static boolean containsAny(String text, String... keywords) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        for (String k : keywords) {
            if (lower.contains(k.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasSkillLike(List<String> skills, String... keywords) {
        if (skills == null) {
            return false;
        }
        for (String s : skills) {
            if (containsAny(s, keywords)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isArchitectOrSeniorRole(String title) {
        return containsAny(title, "architect", "kiến trúc", "principal", "staff engineer", "tech lead", "lead engineer");
    }

    private static boolean isDevOrEngineerRole(String title) {
        return containsAny(title, "developer", "dev", "engineer", "kỹ sư", "lập trình", "frontend", "backend", "fullstack");
    }

    private static List<String> cleanSkills(List<String> skills) {
        List<String> out = new ArrayList<>();
        if (skills != null) {
            for (String s : skills) {
                if (s != null && !s.isBlank()) {
                    out.add(s.trim());
                }
            }
        }
        return out;
    }

    private static List<String> missingSkills(Profile viewer, Profile target) {
        Set<String> mine = new LinkedHashSet<>();
        for (String s : cleanSkills(viewer.skills())) {
            mine.add(s.toLowerCase(Locale.ROOT));
        }
        List<String> out = new ArrayList<>();
        for (String s : cleanSkills(target.skills())) {
            if (!mine.contains(s.toLowerCase(Locale.ROOT)) && out.size() < 3) {
                out.add(s);
            }
        }
        return out;
    }

    private static List<String> sharedSkills(Profile viewer, Profile target) {
        Set<String> mine = new LinkedHashSet<>();
        for (String s : cleanSkills(viewer.skills())) {
            mine.add(s.toLowerCase(Locale.ROOT));
        }
        List<String> out = new ArrayList<>();
        for (String s : cleanSkills(target.skills())) {
            if (mine.contains(s.toLowerCase(Locale.ROOT)) && out.size() < 3) {
                out.add(s);
            }
        }
        return out;
    }

    // ------------------------------------------------------------------ nội dung

    private static String summary(Profile viewer, Facts vf, Profile target, Facts tf, String rel, boolean viewerEmpty,
                                  Domain vd, Domain td) {
        StringBuilder sb = new StringBuilder();
        String n = name(target);
        if (tf.ladder().isEmpty()) {
            sb.append(n).append(cohortText(target)).append(" hiện giới thiệu hồ sơ là \"")
                    .append(target.headline() != null && !target.headline().isBlank() ? target.headline().trim() : "Cựu sinh viên FPTU")
                    .append("\". ");
        } else {
            sb.append(n).append(cohortText(target)).append(" hiện giữ vai trò ").append(currentRoleText(tf)).append(". ");
            switch (rel) {
                case "EXECUTIVE_LEADER" -> {
                    int years = tf.yearsToCurrentRole() != null && tf.yearsToCurrentRole() > 0
                            ? tf.yearsToCurrentRole() : (tf.yearsSinceFirstJob() == null ? 0 : tf.yearsSinceFirstJob());
                    sb.append("Xuất phát từ nền tảng kỹ thuật tại ").append(firstStepText(tf)).append(", ");
                    if (years > 0 && tf.companyCount() > 1) {
                        sb.append(n).append(" đã trải qua ").append(years).append(" năm tôi luyện qua ")
                                .append(tf.companyCount()).append(" môi trường doanh nghiệp để chạm tới vị trí lãnh đạo này.");
                    } else if (years > 0) {
                        sb.append(n).append(" đã gắn bó bền bỉ và phát triển theo chiều sâu suốt ").append(years)
                                .append(" năm trong cùng một hệ thống để đảm nhận vai trò dẫn dắt.");
                    } else {
                        sb.append(n).append(" đã sớm khẳng định năng lực điều hành và lãnh đạo.");
                    }
                    if (tf.turningPoint() != null) {
                        sb.append(" Bước ngoặt từ thực thi kỹ thuật sang dẫn dắt chiến lược được đánh dấu từ ").append(tf.turningPoint()).append(".");
                    }
                }
                case "CROSS_INDUSTRY" -> sb.append(n).append(" đang hoạt động thành công trong lĩnh vực ").append(td.label)
                        .append(", khác với hướng ").append(vd.label)
                        .append(" của bạn. Đây là góc nhìn giá trị nếu bạn muốn mở rộng hiểu biết liên ngành hoặc tìm kiếm cơ hội hợp tác đa lĩnh vực.");
                default -> {
                    int expYears = tf.yearsSinceFirstJob() == null ? 0 : tf.yearsSinceFirstJob();
                    if (isArchitectOrSeniorRole(tf.currentTitle()) && isDevOrEngineerRole(vf.currentTitle())) {
                        sb.append("Với bề dày ").append(expYears)
                                .append(" năm kinh nghiệm thực chiến, đây là hình mẫu tiêu biểu cho chặng đường chuyển đổi từ kỹ sư thực thi (Developer) lên vai trò kiến trúc sư giải pháp (Solutions Architect) tổng thể.");
                    } else if (tf.companyCount() == 1 && expYears >= 3) {
                        sb.append("Lộ trình cho thấy sự gắn bó bền bỉ và phát triển chuyên sâu suốt ").append(expYears)
                                .append(" năm trong một môi trường công nghệ duy nhất để tích lũy bề dày uy tín kỹ thuật.");
                    } else {
                        sb.append("Lộ trình này thể hiện quá trình tích lũy chuyên môn vững chắc qua ")
                                .append(Math.max(1, tf.companyCount())).append(" môi trường công việc với ")
                                .append(expYears).append(" năm kinh nghiệm thực tế.");
                    }
                }
            }
        }
        if (viewerEmpty) {
            sb.append(" Với bạn (đang học tập tại Đại học FPT), đây là lộ trình tham khảo rất thiết thực để bạn chuẩn bị hành trang kỹ năng và đồ án ngay từ giảng đường.");
        }
        return sb.toString().trim();
    }

    private static List<String> ladderTakeaways(Facts tf) {
        List<String> out = new ArrayList<>();
        List<Step> ladder = tf.ladder();
        for (int i = 0; i < ladder.size(); i++) {
            Step s = ladder.get(i);
            boolean first = i == 0;
            boolean last = i == ladder.size() - 1;
            String text;
            if (isArchitectOrSeniorRole(s.title())) {
                text = "Đảm nhận trọng trách quy hoạch kiến trúc giải pháp và tối ưu hóa hệ thống ở quy mô lớn tại "
                        + (s.company() == null || s.company().isBlank() ? "doanh nghiệp." : s.company().trim() + ".");
            } else if (s.leadership() && !first) {
                text = "Bước ngoặt quan trọng: chuyển dịch từ chuyên môn thuần túy sang vai trò dẫn dắt kỹ thuật và điều phối đội ngũ"
                        + (last ? " đến nay." : ".");
            } else if (first && ladder.size() == 1) {
                text = "Gắn bó dài hạn và liên tục đi sâu vào hệ thống công nghệ cốt lõi của "
                        + (s.company() == null || s.company().isBlank() ? "doanh nghiệp." : s.company().trim() + ".");
            } else if (first) {
                text = "Nấc thang khởi đầu: xây dựng nền tảng kỹ thuật và tác phong thực chiến đầu tiên"
                        + (s.company() == null || s.company().isBlank() ? "." : " tại " + s.company().trim() + ".");
            } else if (last) {
                text = "Vị trí chủ chốt hiện tại: vận dụng toàn diện bề dày kinh nghiệm để giải quyết các bài toán kỹ thuật phức tạp.";
            } else {
                text = "Mở rộng tầm ảnh hưởng và thử sức với quy mô hệ thống mới tại "
                        + (s.company() == null || s.company().isBlank() ? "môi trường mới." : s.company().trim() + ".");
            }
            out.add(text);
        }
        return out;
    }

    private static List<String> sharedStrengths(Profile viewer, Profile target, Domain vd, Domain td) {
        List<String> out = new ArrayList<>();
        if (viewer.major() != null && target.major() != null && !viewer.major().isBlank()
                && viewer.major().trim().equalsIgnoreCase(target.major().trim())) {
            out.add("Cùng nền tảng chuyên môn ngành " + viewer.major().trim() + " tại Đại học FPT");
        } else if (vd == Domain.TECH && td == Domain.TECH) {
            out.add("Cùng nền tảng công nghệ thông tin và tư duy xây dựng hệ thống từ Đại học FPT");
        }
        List<String> shared = sharedSkills(viewer, target);
        if (!shared.isEmpty()) {
            out.add("Cùng làm chủ các kỹ năng công nghệ cốt lõi: " + String.join(", ", shared));
        }
        if (out.size() < 2 && vd == Domain.TECH) {
            out.add("Nền tảng lập trình thực chiến là xuất phát điểm then chốt để tiến lên các nấc thang kỹ thuật cao hơn");
        }
        if (out.isEmpty()) {
            out.add("Cùng xuất thân từ môi trường đào tạo năng động của Đại học FPT");
        }
        return out.subList(0, Math.min(3, out.size()));
    }

    private static String[] domainCore(Domain d) {
        return switch (d) {
            case TECH -> new String[]{"Nền tảng lập trình, cấu trúc dữ liệu và hệ quản trị cơ sở dữ liệu",
                    "Kiến trúc phần mềm (Microservices, API) và quy trình CI/CD",
                    "Tư duy thiết kế hệ thống chịu tải cao và kiểm thử chất lượng"};
            case FINANCE -> new String[]{"Đọc hiểu báo cáo tài chính và các chỉ số quản trị dòng tiền",
                    "Nguyên tắc quản trị rủi ro và tuân thủ trong tài chính - ngân hàng",
                    "Quy trình nghiệp vụ ngân hàng/kế toán và công cụ phân tích nâng cao"};
            case MARKETING -> new String[]{"Phễu marketing, định vị thương hiệu và hành vi người dùng",
                    "Đo lường hiệu quả chiến dịch số (KPI, ROI, Conversion Rate)",
                    "Xây dựng chiến lược nội dung và phân phối đa kênh"};
            case DESIGN -> new String[]{"Nguyên lý thiết kế giao diện, trải nghiệm người dùng (UI/UX)",
                    "Quy trình nghiên cứu người dùng (User Research) và Design System",
                    "Lập hồ sơ thiết kế và thành thạo công cụ thiết kế chuyên nghiệp (Figma)"};
            case BUSINESS -> new String[]{"Kỹ năng đàm phán, quản lý quan hệ khách hàng và đối tác",
                    "Quản lý quy trình vận hành và tối ưu hóa chuỗi cung ứng",
                    "Phân tích thị trường và lập mô hình kinh doanh"};
            default -> new String[]{"Kiến thức nghiệp vụ cốt lõi của ngành mục tiêu",
                    "Thuật ngữ chuyên môn và quy trình làm việc đặc thù",
                    "Mạng lưới chuyên môn và dự án thực tế trong ngành đó"};
        };
    }

    private static List<String> gaps(Profile viewer, Facts vf, Profile target, Facts tf, String rel, boolean viewerEmpty,
                                     Domain td) {
        List<String> out = new ArrayList<>();
        if (rel.equals("CROSS_INDUSTRY")) {
            for (String s : domainCore(td)) {
                out.add(s);
            }
            return out;
        }
        if (viewerEmpty) {
            String first = firstStepText(tf);
            if (!first.isEmpty()) {
                out.add("Kinh nghiệm thực chiến ở các vị trí khởi nghiệp như " + first);
            }
            List<String> missing = missingSkills(viewer, target);
            if (!missing.isEmpty()) {
                out.add("Kỹ năng kỹ thuật chuyên sâu: " + String.join(", ", missing));
            }
            out.add("Đồ án tốt nghiệp thực chiến hoặc chứng chỉ quốc tế chứng minh năng lực sẵn sàng làm việc");
            return out.subList(0, Math.min(3, out.size()));
        }

        List<String> missing = missingSkills(viewer, target);
        if (!missing.isEmpty()) {
            out.add("Kỹ năng chuyên môn mục tiêu: " + String.join(", ", missing));
        }

        if (isArchitectOrSeniorRole(tf.currentTitle())) {
            out.add("Tư duy thiết kế kiến trúc phân tán (System Design, Microservices, Cloud) thay vì chỉ dừng ở mức viết code tính năng");
            out.add("Năng lực đánh giá các yếu tố phi chức năng: tính sẵn sàng cao (High Availability), khả năng chịu tải và tối ưu chi phí hạ tầng");
        } else if (rel.equals("EXECUTIVE_LEADER") || tf.turningPoint() != null) {
            out.add("Năng lực hoạch định chiến lược kỹ thuật và quản trị nguồn lực đội ngũ");
        }

        if (out.size() < 2 && tf.currentCompany() != null && !tf.currentCompany().isBlank()) {
            out.add("Kinh nghiệm vận hành và giải quyết bài toán quy mô lớn trong môi trường tập đoàn công nghệ (" + tf.currentCompany().trim() + ")");
        }
        if (out.size() < 2) {
            out.add("Bề dày kinh nghiệm thực chiến xử lý các bài toán kỹ thuật phức tạp qua chu kỳ phát triển sản phẩm dài hạn");
        }
        return out.subList(0, Math.min(3, out.size()));
    }

    private static List<String> transferable(Profile viewer, Profile target, String rel, Domain vd) {
        List<String> out = new ArrayList<>();
        List<String> mySkills = cleanSkills(viewer.skills());

        // Phân tích kỹ năng đòn bẩy dựa trên hồ sơ thực tế của người xem
        if (hasSkillLike(mySkills, "java", "spring", "backend", "c#", ".net", "go", "python")) {
            out.add("Nền tảng lập trình Backend vững vàng giúp bạn nhanh chóng hiểu sâu cơ chế hoạt động của các dịch vụ lõi và luồng dữ liệu hệ thống");
        }
        if (hasSkillLike(mySkills, "frontend", "react", "vue", "angular", "ui", "javascript", "typescript")) {
            out.add("Trải nghiệm phát triển giao diện (Frontend) mang lại góc nhìn toàn diện từ phía người dùng cuối, hỗ trợ đắc lực khi thiết kế luồng API");
        }
        if (hasSkillLike(mySkills, "docker", "devops", "cloud", "aws", "kubernetes", "ci/cd")) {
            out.add("Sự quen thuộc với container hóa (Docker) là bàn đạp quan trọng để tiếp cận các giải pháp điều phối hạ tầng đám mây hiện đại");
        }
        if (hasSkillLike(mySkills, "sql", "mysql", "postgres", "database", "data")) {
            out.add("Tư duy cấu trúc dữ liệu và tối ưu hóa truy vấn cơ sở dữ liệu là tiền đề quan trọng cho các bài toán hiệu năng cao");
        }
        if (hasSkillLike(mySkills, "english", "tieng anh", "ielts", "toeic", "japanese", "tieng nhat")) {
            out.add("Năng lực ngoại ngữ tốt là lợi thế lớn để tiếp cận tài liệu kỹ thuật chuyên sâu và giao tiếp trong môi trường quốc tế");
        }

        if (out.isEmpty()) {
            if (vd == Domain.TECH) {
                out.add("Tư duy lập trình thực chiến và khả năng tự nghiên cứu công nghệ mới là đòn bẩy quan trọng nhất của bạn");
            } else {
                out.add("Nền tảng đào tạo bài bản và khả năng học hỏi thích ứng nhanh chóng là lợi thế cốt lõi");
            }
        }
        return out.subList(0, Math.min(3, out.size()));
    }

    private static String advice(Profile viewer, Facts vf, Profile target, Facts tf, String rel, boolean viewerEmpty,
                                 Domain td) {
        String n = name(target);
        String first = firstStepText(tf);

        if (viewerEmpty && !rel.equals("CROSS_INDUSTRY")) {
            List<String> missing = missingSkills(viewer, target);
            StringBuilder sb = new StringBuilder("Hãy tận dụng tối đa thời gian trên ghế giảng đường Đại học FPT: ");
            if (!first.isEmpty()) {
                sb.append(n).append(" khởi đầu bằng vị trí ").append(first)
                        .append(", do đó mục tiêu thiết thực nhất là hoàn thiện 1-2 đồ án thực chiến có triển khai thực tế trên Cloud/Docker.");
            } else {
                sb.append("hãy tập trung hoàn thành 1-2 đồ án thật có mã nguồn chỉn chu và lấy một chứng chỉ kỹ thuật quốc tế.");
            }
            if (!missing.isEmpty()) {
                sb.append(" Ưu tiên bổ sung các kỹ năng: ").append(String.join(", ", missing)).append(".");
            }
            sb.append(" Đừng ngần ngại nhắn tin cho ").append(n).append(" trên AlumNect để xin phản hồi về tiêu chuẩn tuyển dụng hiện nay.");
            return sb.toString();
        }

        switch (rel) {
            case "EXECUTIVE_LEADER":
                return "Đừng vội đặt nặng chức danh quản lý. " + (first.isEmpty() ? n : n + " xuất phát từ " + first)
                        + (tf.turningPoint() != null ? " và chỉ bước sang vai trò dẫn dắt vào " + tf.turningPoint() : "")
                        + ". Hãy tập trung làm thật xuất sắc vai trò chuyên môn hiện tại, chủ động nhận điều phối các module quan trọng để tạo bước đệm dẫn dắt đội ngũ, đồng thời kết nối với "
                        + n + " để học hỏi tư duy quản trị.";
            case "CROSS_INDUSTRY": {
                String[] core = domainCore(td);
                return "Bắt đầu với 2 kiến thức nền tảng của ngành " + td.label + ": " + core[0] + "; " + core[1]
                        + ". Sau đó thử sức trong một dự án liên ngành nhỏ, tận dụng thế mạnh công nghệ hiện có của bạn làm điểm tựa khi trao đổi học hỏi cùng "
                        + n + ".";
            }
            default: {
                if (isArchitectOrSeniorRole(tf.currentTitle())) {
                    return "Để tiệm cận vị trí " + (tf.currentTitle() != null ? tf.currentTitle().trim() : "kiến trúc sư giải pháp")
                            + ", hãy chủ động xin tham gia vào các bài toán về tối ưu hiệu năng database, caching hoặc thiết kế API phân tán trong dự án hiện tại. Đồng thời, hãy tìm hiểu lộ trình lấy chứng chỉ Cloud (AWS/Azure Solutions Architect) và nhắn tin kết nối với "
                            + n + " trên AlumNect để xin lời khuyên thực tế.";
                }
                List<String> missing = missingSkills(viewer, target);
                StringBuilder sb = new StringBuilder("Hành động thiết thực tiếp theo: ");
                if (!missing.isEmpty()) {
                    sb.append("bổ sung kỹ năng ").append(String.join(", ", missing))
                            .append(" qua một case-study hoặc dự án thực tế; ");
                } else {
                    sb.append("chủ động nhận thêm trách nhiệm ở các khâu kỹ thuật có độ phức tạp cao hơn trong dự án; ");
                }
                sb.append("đồng thời gửi lời chào và nhắn tin trao đổi với ").append(n)
                        .append(" trên AlumNect để xin góc nhìn định hướng về lộ trình phát triển lên vị trí ")
                        .append(tf.currentTitle() == null ? "nâng cao" : tf.currentTitle().trim()).append(".");
                return sb.toString();
            }
        }
    }
}
