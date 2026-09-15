package com.alumnect.alumnect_backend.dao.salary;

import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng salary_contributions (đóng góp dữ liệu lương ẩn
 * danh — UC50 Contribute salary data; thống kê — UC53 View salary statistics; lọc — UC54 Filter
 * salary data).
 * <p>
 * Các query thống kê dùng chung 1 quy ước cho bộ lọc tùy chọn (mirror pattern
 * {@code QuestionRepository.findActiveQuestions} — cờ {@code filterByX} + giá trị {@code x}, cờ
 * false thì bỏ qua điều kiện, tránh phụ thuộc vào việc bind tham số null trực tiếp trong native SQL):
 * {@code filterByIndustry/industryId}, {@code filterByRegion/region} (mẫu LIKE đã chuẩn hóa),
 * {@code filterByJobTitle/jobTitle} (mẫu LIKE đã chuẩn hóa), {@code filterByLevel/level}
 * ("Junior"/"Mid"/"Senior", đã validate ở tầng Service).
 */
@Repository
public interface SalaryContributionRepository extends JpaRepository<SalaryContribution, Long> {

    /**
     * Lấy toàn bộ lượt đóng góp của một người dùng, mới nhất trước — dùng cho UC51 (Edit salary
     * contribution) để chính chủ xem lại và chọn bản ghi cần sửa.
     *
     * @param userId ID người dùng (chính chủ, lấy từ JWT)
     * @return Danh sách lượt đóng góp của người dùng, sắp xếp theo thời điểm tạo giảm dần
     */
    List<SalaryContribution> findByUser_IdOrderByCreatedAtDesc(Long userId);

    /**
     * Lấy TOÀN BỘ lượt đóng góp lương trong hệ thống (không lọc theo chủ sở hữu), phân trang, mới
     * nhất trước — dùng cho luồng "xem từng lượt đóng góp ẩn danh" (khác thống kê nhóm ở UC53/UC54):
     * Student/Alumni đăng nhập xem được TỪNG bản ghi lương thô, nhưng vẫn qua {@code SalaryMapper}
     * nên KHÔNG có trường nào định danh người đóng góp — chỉ chính chủ mới biết bản ghi nào là của
     * mình (qua {@code findByUser_IdOrderByCreatedAtDesc} ở trên).
     *
     * @param pageable Thông tin phân trang + sắp xếp (Service luôn set sort theo {@code createdAt} giảm dần)
     * @return Trang kết quả các lượt đóng góp, mới nhất trước
     */
    Page<SalaryContribution> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Biểu thức xác định khu vực thống kê: ưu tiên location_city (Tên thành phố chuẩn do API bản đồ
     * tự động bóc tách từ địa chỉ), nếu trống thì fallback về region.
     */
    String STATS_REGION_EXPR = "COALESCE(NULLIF(TRIM(location_city), ''), NULLIF(TRIM(region), ''), 'Chưa xác định')";

    /**
     * Điều kiện WHERE dùng chung cho bộ lọc UC54 (industry/region/jobTitle/level), tái dùng ở cả 3
     * query thống kê. So khớp {@code region} qua biểu thức chuẩn hóa {@link #STATS_REGION_EXPR}.
     */
    String FILTER_WHERE_CLAUSE = " "
            + "(:filterByIndustry = false OR industry_id = :industryId) "
            + "AND (:filterByRegion = false OR (" + STATS_REGION_EXPR + ") ILIKE :region) "
            + "AND (:filterByJobTitle = false OR job_title ILIKE :jobTitle) "
            + "AND ( "
            + "    :filterByLevel = false "
            + "    OR (:level = 'Junior' AND (years_experience IS NULL OR years_experience < 2)) "
            + "    OR (:level = 'Mid' AND years_experience BETWEEN 2 AND 5) "
            + "    OR (:level = 'Senior' AND years_experience > 5) "
            + ") ";

    /**
     * Thống kê lương theo nhóm (chức danh + cấp bậc suy ra từ kinh nghiệm + khu vực chuẩn hóa theo thành phố).
     */
    @Query(value = "SELECT "
            + "    MIN(job_title) AS role, "
            + "    CASE "
            + "        WHEN years_experience IS NULL OR years_experience < 2 THEN 'Junior' "
            + "        WHEN years_experience <= 5 THEN 'Mid' "
            + "        ELSE 'Senior' "
            + "    END AS level, "
            + "    MIN(" + STATS_REGION_EXPR + ") AS region, "
            + "    COUNT(*) AS samples, "
            + "    ROUND((PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) AS p25, "
            + "    ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) AS median, "
            + "    ROUND((PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) AS p75 "
            + "FROM salary_contributions "
            + "WHERE currency = 'VND' "
            + "AND " + FILTER_WHERE_CLAUSE
            + "GROUP BY "
            + "    LOWER(TRIM(job_title)), "
            + "    CASE "
            + "        WHEN years_experience IS NULL OR years_experience < 2 THEN 'Junior' "
            + "        WHEN years_experience <= 5 THEN 'Mid' "
            + "        ELSE 'Senior' "
            + "    END, "
            + "    LOWER(TRIM(" + STATS_REGION_EXPR + ")) "
            + "HAVING COUNT(*) >= :minSamples "
            + "ORDER BY samples DESC", nativeQuery = true)
    List<Object[]> findGroupedStatistics(
            @Param("filterByIndustry") boolean filterByIndustry, @Param("industryId") Long industryId,
            @Param("filterByRegion") boolean filterByRegion, @Param("region") String region,
            @Param("filterByJobTitle") boolean filterByJobTitle, @Param("jobTitle") String jobTitle,
            @Param("filterByLevel") boolean filterByLevel, @Param("level") String level,
            @Param("minSamples") int minSamples);

    /**
     * Trung vị mức lương gộp/tháng trên dữ liệu VND khớp bộ lọc (UC54), không nhóm, đơn vị Triệu VNĐ.
     *
     * @return Trung vị đã quy đổi, hoặc {@code null} nếu không có bản ghi VND nào khớp bộ lọc
     */
    @Query(value = "SELECT ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) "
            + "FROM salary_contributions "
            + "WHERE currency = 'VND' "
            + "AND " + FILTER_WHERE_CLAUSE, nativeQuery = true)
    BigDecimal findOverallMedianVnd(
            @Param("filterByIndustry") boolean filterByIndustry, @Param("industryId") Long industryId,
            @Param("filterByRegion") boolean filterByRegion, @Param("region") String region,
            @Param("filterByJobTitle") boolean filterByJobTitle, @Param("jobTitle") String jobTitle,
            @Param("filterByLevel") boolean filterByLevel, @Param("level") String level);

    /**
     * Tổng số lượt đóng góp khớp bộ lọc (UC54) — KHÔNG giới hạn theo {@code currency} (khác 2 query
     * trên chỉ tính VND), phản ánh đúng "tổng lượt khảo sát" trên mọi loại tiền tệ.
     *
     * @return Số lượt đóng góp khớp bộ lọc
     */
    @Query(value = "SELECT COUNT(*) FROM salary_contributions WHERE " + FILTER_WHERE_CLAUSE, nativeQuery = true)
    long countFiltered(
            @Param("filterByIndustry") boolean filterByIndustry, @Param("industryId") Long industryId,
            @Param("filterByRegion") boolean filterByRegion, @Param("region") String region,
            @Param("filterByJobTitle") boolean filterByJobTitle, @Param("jobTitle") String jobTitle,
            @Param("filterByLevel") boolean filterByLevel, @Param("level") String level);
}
