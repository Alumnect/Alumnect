package com.alumnect.alumnect_backend.specification.salary;

import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp hỗ trợ xây dựng truy vấn động (Specification) cho bảng salary_contributions.
 * Hỗ trợ lọc theo ngành nghề, khu vực/tỉnh thành, và từ khóa tìm kiếm (chức danh, công ty).
 */
public class SalarySpecification {

    /**
     * Tạo Specification lọc các lượt đóng góp lương cho luồng Feed.
     *
     * @param industryId ID ngành nghề cần lọc (tùy chọn)
     * @param region     Khu vực hoặc tỉnh thành cần lọc (tùy chọn, so khớp với region hoặc locationCity)
     * @param search     Từ khóa tìm kiếm (tùy chọn, so khớp với jobTitle hoặc company)
     * @return Specification của thực thể SalaryContribution
     */
    public static Specification<SalaryContribution> filterFeed(
            Long industryId,
            String region,
            String search
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo ngành nghề
            if (industryId != null) {
                predicates.add(cb.equal(root.get("industry").get("id"), industryId));
            }

            // 2. Lọc theo khu vực / thành phố (khớp region hoặc locationCity)
            if (region != null && !region.trim().isEmpty()) {
                String pattern = "%" + region.trim().toLowerCase() + "%";
                Predicate matchRegion = cb.like(cb.lower(root.get("region")), pattern);
                Predicate matchCity = cb.like(cb.lower(root.get("locationCity")), pattern);
                predicates.add(cb.or(matchRegion, matchCity));
            }

            // 3. Tìm kiếm theo chức danh công việc hoặc tên công ty
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate matchTitle = cb.like(cb.lower(root.get("jobTitle")), pattern);
                Predicate matchCompany = cb.like(cb.lower(root.get("company")), pattern);
                predicates.add(cb.or(matchTitle, matchCompany));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
