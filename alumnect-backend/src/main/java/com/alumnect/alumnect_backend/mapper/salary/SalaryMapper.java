package com.alumnect.alumnect_backend.mapper.salary;

import com.alumnect.alumnect_backend.dto.response.salary.IndustryResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import org.springframework.stereotype.Component;

/**
 * Lớp Mapper chuyển đổi dữ liệu Salary Board (UC50 - Contribute salary data) sang DTO trả về Client.
 */
@Component
public class SalaryMapper {

    /**
     * Chuyển đổi một ngành nghề sang IndustryResponse cho dropdown phía Frontend.
     *
     * @param industry Entity ngành nghề
     * @return DTO gồm id và tên
     */
    public IndustryResponse toResponse(Industry industry) {
        return IndustryResponse.builder()
                .id(industry.getId())
                .name(industry.getName())
                .build();
    }

    /**
     * Chuyển đổi một lượt đóng góp lương sang SalaryContributionResponse trả về Client.
     * Cố tình KHÔNG map bất kỳ trường nào từ {@code contribution.getUser()} — giữ ẩn danh.
     *
     * @param contribution Entity lượt đóng góp (đã JOIN FETCH sẵn {@code industry} nếu cần)
     * @return DTO phẳng, không chứa thông tin định danh người đóng góp
     */
    public SalaryContributionResponse toResponse(SalaryContribution contribution) {
        Industry industry = contribution.getIndustry();
        return SalaryContributionResponse.builder()
                .id(String.valueOf(contribution.getId()))
                .industryId(industry != null ? industry.getId() : null)
                .industry(industry != null ? industry.getName() : "")
                .jobTitle(contribution.getJobTitle())
                .company(contribution.getCompany() != null ? contribution.getCompany() : "")
                .region(contribution.getRegion() != null ? contribution.getRegion() : "")
                .yearsExperience(contribution.getYearsExperience())
                .grossAmount(contribution.getGrossAmount())
                .currency(contribution.getCurrency())
                .createdAt(contribution.getCreatedAt() != null ? contribution.getCreatedAt().toString() : "")
                .build();
    }
}
