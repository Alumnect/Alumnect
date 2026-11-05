package com.alumnect.alumnect_backend.dto.response.careerpath;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO kết quả AI đối chiếu lộ trình [C2]. Hình dạng bám sát Output Schema của đặc tả
 * ({@code targetPerson, comparisonSummaryVi, historicalLadder, sharedStrengths, keyGapsToBridge, transferableSkills,
 * actionableAdviceVi}); bổ sung {@code viewerPerson}/{@code viewerLadder} cho bảng so sánh song song và
 * {@code source} (GEMINI | LOCAL_FALLBACK). Các nấc thang, số năm, tên công ty LUÔN lấy từ dữ liệu hồ sơ thật.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerAiCompareResponse {

    private PersonCard targetPerson;
    private PersonCard viewerPerson;
    private String comparisonSummaryVi;
    private List<LadderStep> historicalLadder;
    /** Lộ trình của người xem (rỗng nếu chưa có kinh nghiệm — kịch bản D). */
    private List<LadderStep> viewerLadder;
    private List<String> sharedStrengths;
    private List<String> keyGapsToBridge;
    private List<String> transferableSkills;
    private String actionableAdviceVi;
    /** true nếu người xem đã có lịch sử công tác; false = kịch bản D (đối chiếu theo chuyên ngành + kỹ năng). */
    private boolean viewerHasExperience;
    /** "GEMINI" hoặc "LOCAL_FALLBACK". */
    private String source;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonCard {
        private Long userId;
        private String name;
        private String avatarUrl;
        private String headline;
        private String currentRole;
        private String company;
        private String majorName;
        private Integer cohort;
        /** EXECUTIVE_LEADER | PEER_OR_SENIOR | CROSS_INDUSTRY — chỉ có ở {@code targetPerson}. */
        private String relationshipType;
        /** Số năm kể từ công việc đầu tiên (null nếu chưa có kinh nghiệm). */
        private Integer yearsSinceFirstJob;
        private int companyCount;
        private List<String> skills;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LadderStep {
        /** VD "2015 - 2017 (2 năm)" hoặc "2020 - Nay". */
        private String period;
        /** VD "Senior Engineer -> Solution Architect". */
        private String title;
        private String company;
        private String takeawayVi;
    }
}
