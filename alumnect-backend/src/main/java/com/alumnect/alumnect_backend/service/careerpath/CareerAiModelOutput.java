package com.alumnect.alumnect_backend.service.careerpath;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Phần văn bản do Gemini (hoặc bộ soạn cục bộ) tạo cho C2. Các dữ kiện (nấc thang, năm, công ty, loại quan hệ) KHÔNG
 * nằm ở đây — chúng được backend tính tất định từ hồ sơ thật. Viết tay getter/setter (không Lombok) để lớp này dùng
 * được cả trong bộ kiểm thử độc lập.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CareerAiModelOutput {

    private String comparisonSummaryVi;
    /** Nhận xét cho từng nấc thang, theo đúng thứ tự các nấc đã cung cấp. */
    private List<String> ladderTakeawaysVi = new ArrayList<>();
    private List<String> sharedStrengths = new ArrayList<>();
    private List<String> keyGapsToBridge = new ArrayList<>();
    private List<String> transferableSkills = new ArrayList<>();
    private String actionableAdviceVi;

    public String getComparisonSummaryVi() { return comparisonSummaryVi; }
    public void setComparisonSummaryVi(String v) { this.comparisonSummaryVi = v; }
    public List<String> getLadderTakeawaysVi() { return ladderTakeawaysVi; }
    public void setLadderTakeawaysVi(List<String> v) { this.ladderTakeawaysVi = v; }
    public List<String> getSharedStrengths() { return sharedStrengths; }
    public void setSharedStrengths(List<String> v) { this.sharedStrengths = v; }
    public List<String> getKeyGapsToBridge() { return keyGapsToBridge; }
    public void setKeyGapsToBridge(List<String> v) { this.keyGapsToBridge = v; }
    public List<String> getTransferableSkills() { return transferableSkills; }
    public void setTransferableSkills(List<String> v) { this.transferableSkills = v; }
    public String getActionableAdviceVi() { return actionableAdviceVi; }
    public void setActionableAdviceVi(String v) { this.actionableAdviceVi = v; }
}
