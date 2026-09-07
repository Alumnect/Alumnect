package com.alumnect.alumnect_backend.dao.salary;

import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
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
     * Điều kiện WHERE dùng chung cho bộ lọc UC54 (industry/region/jobTitle/level), tái dùng ở cả 3
     * query thống kê. So khớp {@code region} qua CÙNG biểu thức {@code COALESCE(NULLIF(TRIM(region),
     * ''), 'Chưa xác định')} dùng ở SELECT/GROUP BY của {@link #findGroupedStatistics} — để khi
     * Frontend chọn đúng nhãn "Chưa xác định" (lấy từ danh sách khu vực do chính API này trả về) thì
     * lọc đúng các bản ghi có khu vực trống, không phải so khớp text "Chưa xác định" theo nghĩa đen.
     */
    String FILTER_WHERE_CLAUSE = """
            (:filterByIndustry = false OR industry_id = :industryId)
            AND (:filterByRegion = false OR LOWER(COALESCE(NULLIF(TRIM(region), ''), 'Chưa xác định')) LIKE :region ESCAPE '\\')
            AND (:filterByJobTitle = false OR LOWER(job_title) LIKE :jobTitle ESCAPE '\\')
            AND (
                :filterByLevel = false
                OR (:level = 'Junior' AND (years_experience IS NULL OR years_experience < 2))
                OR (:level = 'Mid' AND years_experience BETWEEN 2 AND 5)
                OR (:level = 'Senior' AND years_experience > 5)
            )
            """;

    /**
     * Thống kê lương theo nhóm (chức danh + cấp bậc suy ra từ kinh nghiệm + khu vực), chỉ tính trên
     * dữ liệu VND (không quy đổi ngoại tệ — ngoài phạm vi UC53), chỉ trả nhóm đạt đủ số mẫu tối thiểu
     * ({@code minSamples}) để bảo vệ ẩn danh. Áp dụng thêm bộ lọc tùy chọn (UC54 - Filter salary data)
     * theo ngành/khu vực/chức danh/cấp bậc — xem quy ước cờ {@code filterByX} ở Javadoc lớp. Dùng
     * {@code PERCENTILE_CONT} (hàm PostgreSQL) tính p25/median/p75; quy đổi sang đơn vị Triệu VNĐ
     * (chia 1.000.000), cast {@code ::numeric} rồi làm tròn 1 chữ số thập phân (PostgreSQL không có
     * overload {@code ROUND(double precision, integer)} — {@code PERCENTILE_CONT} trả
     * {@code double precision}, phải cast sang {@code numeric} trước).
     * `job_title` được so khớp nhóm KHÔNG phân biệt hoa/thường + bỏ khoảng trắng thừa
     * (VD "Backend Developer" và "backend developer " được tính chung 1 nhóm) — chức danh là text tự
     * do khi đóng góp (UC50), nếu so khớp nguyên văn sẽ dễ tách nhầm thành nhiều nhóm nhỏ không đạt
     * ngưỡng mẫu tối thiểu dù cùng 1 vị trí thực tế. Giá trị hiển thị (`role`) lấy đại diện qua
     * {@code MIN()} trên bản ghi gốc (giữ nguyên hoa/thường của 1 lượt đóng góp bất kỳ trong nhóm).
     * <p>
     * Mỗi phần tử {@code Object[]} theo thứ tự: {@code [role(String), level(String), region(String),
     * samples(Long), p25(BigDecimal), median(BigDecimal), p75(BigDecimal)]}.
     *
     * @param filterByIndustry true = lọc theo {@code industryId}; false = bỏ qua điều kiện ngành nghề
     * @param industryId       ID ngành nghề cần lọc (chỉ dùng khi filterByIndustry = true)
     * @param filterByRegion   true = lọc theo {@code region}; false = bỏ qua điều kiện khu vực
     * @param region           mẫu LIKE khu vực đã chuẩn hóa (chỉ dùng khi filterByRegion = true)
     * @param filterByJobTitle true = lọc theo {@code jobTitle}; false = bỏ qua điều kiện chức danh
     * @param jobTitle         mẫu LIKE chức danh đã chuẩn hóa (chỉ dùng khi filterByJobTitle = true)
     * @param filterByLevel    true = lọc theo {@code level}; false = bỏ qua điều kiện cấp bậc
     * @param level            "Junior"/"Mid"/"Senior" (chỉ dùng khi filterByLevel = true, đã validate ở Service)
     * @param minSamples       Số mẫu tối thiểu để một nhóm được hiển thị
     * @return Danh sách nhóm thống kê khớp bộ lọc, sắp xếp theo số mẫu giảm dần
     */
    @Query(value = """
            SELECT
                MIN(job_title) AS role,
                CASE
                    WHEN years_experience IS NULL OR years_experience < 2 THEN 'Junior'
                    WHEN years_experience <= 5 THEN 'Mid'
                    ELSE 'Senior'
                END AS level,
                COALESCE(NULLIF(TRIM(region), ''), 'Chưa xác định') AS region,
                COUNT(*) AS samples,
                ROUND((PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) AS p25,
                ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) AS median,
                ROUND((PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1) AS p75
            FROM salary_contributions
            WHERE currency = 'VND'
            AND """ + FILTER_WHERE_CLAUSE + """
            GROUP BY
                LOWER(TRIM(job_title)),
                CASE
                    WHEN years_experience IS NULL OR years_experience < 2 THEN 'Junior'
                    WHEN years_experience <= 5 THEN 'Mid'
                    ELSE 'Senior'
                END,
                COALESCE(NULLIF(TRIM(region), ''), 'Chưa xác định')
            HAVING COUNT(*) >= :minSamples
            ORDER BY samples DESC
            """, nativeQuery = true)
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
    @Query(value = """
            SELECT ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1)
            FROM salary_contributions
            WHERE currency = 'VND'
            AND """ + FILTER_WHERE_CLAUSE, nativeQuery = true)
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
