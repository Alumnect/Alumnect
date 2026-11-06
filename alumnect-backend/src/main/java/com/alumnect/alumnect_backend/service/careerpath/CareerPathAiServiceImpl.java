package com.alumnect.alumnect_backend.service.careerpath;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.careerpath.CareerAiCompareRequest;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerAiCompareResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.gemini.GeminiClient;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Exp;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Facts;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Profile;
import com.alumnect.alumnect_backend.service.careerpath.CareerAiSupport.Step;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Cài đặt C2. Backend dựng nấc thang / số năm / số công ty / loại quan hệ tất định từ hồ sơ thật; Gemini chỉ viết lời
 * (tóm tắt, nhận xét từng nấc, điểm chung, khoảng trống, kỹ năng đòn bẩy, lời khuyên) bám sát các dữ kiện đó. Gemini
 * lỗi/timeout hoặc trả thiếu → {@link CareerAiLocalComposer} lấp từng trường, nên luôn có kết quả, không báo "thiếu dữ liệu".
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CareerPathAiServiceImpl implements CareerPathAiService {

    private static final int LIST_MAX = 3;

    private static final String SYSTEM_INSTRUCTION = """
            Bạn là chuyên gia cố vấn nghề nghiệp cao cấp của mạng xã hội cựu sinh viên Đại học FPT (AlumNect). Nhiệm vụ: đối chiếu và phân tích sâu sắc, truyền cảm hứng và thiết thực giữa hồ sơ của NGƯỜI XEM với CỰU SINH VIÊN MỤC TIÊU dựa trên dữ liệu thật được cung cấp. Trả về DUY NHẤT một JSON hợp lệ, không bọc markdown hay giải thích ngoài.

            NGUYÊN TẮC:
            - Giọng văn: Chuyên nghiệp, thấu cảm, sắc sảo như một Tech Lead / Senior Career Mentor kỳ cựu.
            - TUYỆT ĐỐI TRÁNH: Các câu từ sáo rỗng, máy móc, chung chung (như "tư duy logic", "cùng làm trong lĩnh vực Công nghệ thông tin", "chênh lệch X năm kinh nghiệm").
            - Nhìn nhận bức tranh chuyển dịch vị trí thực tế: Phân tích sự khác biệt giữa vị trí của người xem (ví dụ: Developer/Fresher) với vị trí mục tiêu (ví dụ: Solutions Architect, Team Lead, Manager, Director...). Nếu người xem làm Backend/Fullstack và mục tiêu là Solutions Architect, chỉ rõ bước chuyển từ việc viết mã tính năng sang thiết kế hệ thống chịu tải cao, microservices, cloud và tối ưu kiến trúc.
            - THEO LOẠI QUAN HỆ (relationshipType đã xác định):
              * EXECUTIVE_LEADER: Phân tích chặng đường từ xuất phát điểm chuyên môn kỹ thuật lên vai trò lãnh đạo/quản lý, các bước ngoặt quan trọng và năng lực chuyển hóa.
              * PEER_OR_SENIOR: Phân tích năng lực chuyên môn cốt lõi, so sánh tư duy thực thi với tư duy thiết kế/quy hoạch giải pháp, và các kỹ năng đòn bẩy.
              * CROSS_INDUSTRY: Phân tích sự giao thoa, kỹ năng chuyển đổi (transferable) từ ngành người xem sang ngành mục tiêu và các kiến thức nghiệp vụ cần bù đắp.
              * NẾU NGƯỜI XEM CHƯA CÓ KINH NGHIỆM: Lấy chuyên ngành FPTU và kỹ năng làm điểm tựa, đối chiếu với giai đoạn khởi đầu của cựu sinh viên mục tiêu để gợi ý hướng đi cụ thể.

            QUY ĐỊNH CÁC TRƯỜNG JSON:
            1. comparisonSummaryVi (2-3 câu): Phân tích sâu sắc, so sánh vị thế hiện tại của người xem với bước tiến của cựu sinh viên mục tiêu; nêu bật bản chất của sự khác biệt về vai trò và tư duy làm việc.
            2. ladderTakeawaysVi (Mảng String): Đúng 1 câu nhận xét sắc sảo cho MỖI nấc thang của cựu sinh viên mục tiêu (theo đúng thứ tự), nêu bật giá trị chuyên môn hoặc bước ngoặt của nấc thang đó.
            3. sharedStrengths (Tối đa 3 mục): Những điểm chung có giá trị thực sự (về nền tảng công nghệ, trường lớp FPTU, tư duy kỹ thuật hoặc các kỹ năng chung).
            4. keyGapsToBridge (2-3 mục): Những khoảng cách năng lực cốt lõi cần bù đắp (ví dụ: kiến thức hệ thống phân tán, microservices, cloud infrastructure, năng lực quản trị quy mô hoặc kỹ năng lãnh đạo).
            5. transferableSkills (1-3 mục): Những kỹ năng/kinh nghiệm người xem đang có đóng vai trò làm bàn đạp, đòn bẩy để tiến lên các nấc tiếp theo.
            6. actionableAdviceVi (2-3 câu): Lời khuyên hành động cụ thể, thiết thực có thể bắt đầu ngay trong 3-6 tháng tới (chứng chỉ quốc tế, bài toán kiến trúc trong dự án, tối ưu hệ thống, hoặc chủ động kết nối trao đổi).

            ĐỊNH DẠNG JSON:
            {"comparisonSummaryVi":"...","ladderTakeawaysVi":["..."],"sharedStrengths":["..."],"keyGapsToBridge":["..."],"transferableSkills":["..."],"actionableAdviceVi":"..."}
            """;

    private final GeminiClient geminiClient;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final UserSkillRepository userSkillRepository;

    @Override
    @Transactional(readOnly = true)
    public CareerAiCompareResponse compare(String email, CareerAiCompareRequest request) {
        User viewerUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = viewerUser.getRole() != null ? viewerUser.getRole().getName().toUpperCase(Locale.ROOT) : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được dùng tính năng so sánh lộ trình");
        }
        Long targetId = request.getTargetUserId();
        if (targetId.equals(viewerUser.getId())) {
            throw new BadRequestException("Bạn đang xem chính hồ sơ của mình, hãy chọn một cựu sinh viên khác để so sánh");
        }
        UserProfile targetProfile = userProfileRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ người dùng với ID: " + targetId));
        User targetUser = targetProfile.getUser();
        if (targetUser.getAccountStatus() != AccountStatus.ACTIVE || targetUser.getRole() == null
                || !"ALUMNI".equalsIgnoreCase(targetUser.getRole().getName())) {
            throw new BadRequestException("Người dùng này không hoạt động hoặc không phải là cựu sinh viên");
        }

        LocalDate today = LocalDate.now();
        Profile viewer = loadProfile(viewerUser.getId(), userProfileRepository.findById(viewerUser.getId()).orElse(null));
        Profile target = loadProfile(targetId, targetProfile);
        Facts vf = CareerAiSupport.analyze(viewer, today);
        Facts tf = CareerAiSupport.analyze(target, today);
        String relationship = CareerAiSupport.classify(viewer, vf, target, tf);

        CareerAiModelOutput local = CareerAiLocalComposer.compose(viewer, vf, target, tf, relationship);
        Optional<CareerAiModelOutput> ai = askGemini(viewer, vf, target, tf, relationship);
        boolean fromGemini = ai.isPresent() && notBlank(ai.get().getComparisonSummaryVi())
                && notBlank(ai.get().getActionableAdviceVi());
        CareerAiModelOutput merged = fromGemini ? merge(ai.get(), local, tf.ladder().size()) : local;

        List<CareerAiCompareResponse.LadderStep> targetLadder = toLadder(tf.ladder(), merged.getLadderTakeawaysVi());
        List<CareerAiCompareResponse.LadderStep> viewerLadder = toLadder(vf.ladder(), Collections.emptyList());

        CareerAiCompareResponse response = CareerAiCompareResponse.builder()
                .targetPerson(toCard(target, tf, relationship))
                .viewerPerson(toCard(viewer, vf, null))
                .comparisonSummaryVi(merged.getComparisonSummaryVi())
                .historicalLadder(targetLadder)
                .viewerLadder(viewerLadder)
                .sharedStrengths(merged.getSharedStrengths())
                .keyGapsToBridge(merged.getKeyGapsToBridge())
                .transferableSkills(merged.getTransferableSkills())
                .actionableAdviceVi(merged.getActionableAdviceVi())
                .viewerHasExperience(!vf.ladder().isEmpty())
                .source(fromGemini ? "GEMINI" : "LOCAL_FALLBACK")
                .build();
        log.info("AI Career [C2]: relationship={}, viewerHasExperience={}, source={}", relationship,
                response.isViewerHasExperience(), response.getSource());
        return response;
    }

    // ------------------------------------------------------------------ nạp dữ liệu

    private Profile loadProfile(Long userId, UserProfile profile) {
        List<Exp> exps = new ArrayList<>();
        for (Experience e : experienceRepository.findByUserIdsSortedChronologically(Collections.singletonList(userId))) {
            exps.add(new Exp(e.getTitle(), e.getCompany(), e.getStartDate(), e.getEndDate(), e.isCurrent()));
        }
        List<String> skills = new ArrayList<>();
        for (UserSkill s : userSkillRepository.findByUserIdOrderBySortOrderAscSkillNameAsc(userId)) {
            if (s.getSkillName() != null && !s.getSkillName().isBlank()) {
                skills.add(s.getSkillName().trim());
            }
        }
        if (profile == null) {
            return new Profile(userId, "Bạn", null, null, null, null, null, skills, exps);
        }
        String major = profile.getMajor() != null ? profile.getMajor().getName() : null;
        return new Profile(userId, profile.getFullName(), profile.getAvatarUrl(), profile.getHeadline(), major,
                profile.getCohort(), profile.getGraduationYear(), skills, exps);
    }

    // ------------------------------------------------------------------ Gemini

    private Optional<CareerAiModelOutput> askGemini(Profile viewer, Facts vf, Profile target, Facts tf, String relationship) {
        StringBuilder sb = new StringBuilder();
        sb.append("relationshipType (đã xác định, không đổi): ").append(relationship).append('\n');
        sb.append("\n=== NGƯỜI XEM ===\n");
        appendProfile(sb, viewer, vf);
        if (vf.ladder().isEmpty()) {
            sb.append("(Người xem CHƯA CÓ kinh nghiệm làm việc: hãy dùng chuyên ngành + kỹ năng làm điểm tựa.)\n");
        }
        sb.append("\n=== CỰU SINH VIÊN MỤC TIÊU ===\n");
        appendProfile(sb, target, tf);
        if (tf.yearsToCurrentRole() != null) {
            sb.append("Số năm từ công việc đầu tiên đến vị trí hiện tại: ").append(tf.yearsToCurrentRole()).append('\n');
        }
        if (tf.turningPoint() != null) {
            sb.append("Bước ngoặt lên dẫn dắt/quản lý: ").append(tf.turningPoint()).append('\n');
        }
        sb.append("\nSố nấc thang của mục tiêu cần nhận xét: ").append(tf.ladder().size())
                .append(" (ladderTakeawaysVi phải có đúng ").append(tf.ladder().size()).append(" phần tử).");
        try {
            return geminiClient.generateStructured(SYSTEM_INSTRUCTION, sb.toString(), CareerAiModelOutput.class);
        } catch (Exception ex) {
            log.warn("AI Career [C2]: Gemini lỗi, dùng bộ soạn cục bộ: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private static void appendProfile(StringBuilder sb, Profile p, Facts f) {
        sb.append("Tên: ").append(p.name()).append('\n');
        if (p.major() != null) {
            sb.append("Chuyên ngành: ").append(p.major()).append('\n');
        }
        if (p.cohort() != null) {
            sb.append("Khóa: K").append(p.cohort()).append('\n');
        }
        if (p.graduationYear() != null) {
            sb.append("Năm tốt nghiệp: ").append(p.graduationYear()).append('\n');
        }
        if (p.headline() != null && !p.headline().isBlank()) {
            sb.append("Tiêu đề hồ sơ: ").append(p.headline().trim()).append('\n');
        }
        if (!p.skills().isEmpty()) {
            sb.append("Kỹ năng: ").append(String.join(", ", p.skills().subList(0, Math.min(15, p.skills().size())))).append('\n');
        }
        if (!f.ladder().isEmpty()) {
            sb.append("Số năm kể từ công việc đầu tiên: ").append(f.yearsSinceFirstJob())
                    .append("; số công ty đã làm: ").append(f.companyCount()).append('\n');
            sb.append("Lịch sử công tác (cũ → mới):\n");
            int i = 1;
            for (Step s : f.ladder()) {
                sb.append(i++).append(". ").append(s.period()).append(" | ").append(s.title())
                        .append(s.company() == null || s.company().isBlank() ? "" : " @ " + s.company()).append('\n');
            }
        }
    }

    // ------------------------------------------------------------------ hợp nhất & ánh xạ

    /** Lấy từng trường Gemini nếu hợp lệ, trường nào thiếu/rỗng thì dùng bản cục bộ. */
    private static CareerAiModelOutput merge(CareerAiModelOutput ai, CareerAiModelOutput local, int ladderSize) {
        CareerAiModelOutput out = new CareerAiModelOutput();
        out.setComparisonSummaryVi(ai.getComparisonSummaryVi().trim());
        out.setActionableAdviceVi(ai.getActionableAdviceVi().trim());
        out.setSharedStrengths(pick(ai.getSharedStrengths(), local.getSharedStrengths()));
        out.setKeyGapsToBridge(pick(ai.getKeyGapsToBridge(), local.getKeyGapsToBridge()));
        out.setTransferableSkills(pick(ai.getTransferableSkills(), local.getTransferableSkills()));
        List<String> takeaways = new ArrayList<>();
        List<String> aiT = ai.getLadderTakeawaysVi() == null ? Collections.emptyList() : ai.getLadderTakeawaysVi();
        for (int i = 0; i < ladderSize; i++) {
            String t = i < aiT.size() ? aiT.get(i) : null;
            takeaways.add(notBlank(t) ? t.trim() : local.getLadderTakeawaysVi().get(i));
        }
        out.setLadderTakeawaysVi(takeaways);
        return out;
    }

    private static List<String> pick(List<String> ai, List<String> local) {
        List<String> clean = new ArrayList<>();
        if (ai != null) {
            for (String s : ai) {
                if (notBlank(s) && clean.size() < LIST_MAX) {
                    clean.add(s.trim());
                }
            }
        }
        return clean.isEmpty() ? local : clean;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static List<CareerAiCompareResponse.LadderStep> toLadder(List<Step> steps, List<String> takeaways) {
        List<CareerAiCompareResponse.LadderStep> out = new ArrayList<>();
        for (int i = 0; i < steps.size(); i++) {
            Step s = steps.get(i);
            out.add(CareerAiCompareResponse.LadderStep.builder()
                    .period(s.period())
                    .title(s.title())
                    .company(s.company())
                    .takeawayVi(i < takeaways.size() ? takeaways.get(i) : "")
                    .build());
        }
        return out;
    }

    private static CareerAiCompareResponse.PersonCard toCard(Profile p, Facts f, String relationship) {
        return CareerAiCompareResponse.PersonCard.builder()
                .userId(p.userId())
                .name(p.name())
                .avatarUrl(p.avatarUrl())
                .headline(p.headline())
                .currentRole(f.currentTitle())
                .company(f.currentCompany())
                .majorName(p.major())
                .cohort(p.cohort())
                .relationshipType(relationship)
                .yearsSinceFirstJob(f.yearsSinceFirstJob())
                .companyCount(f.companyCount())
                .skills(p.skills().subList(0, Math.min(8, p.skills().size())))
                .build();
    }
}
