package com.alumnect.alumnect_backend.dao.salary;

import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng salary_contributions
 * (đóng góp dữ liệu lương ẩn danh — UC50 Contribute salary data; thống kê — UC53 View salary statistics).
 */
@Repository
public interface SalaryContributionRepository extends JpaRepository<SalaryContribution, Long> {

    /**
     * Thống kê lương theo nhóm (chức danh + cấp bậc suy ra từ kinh nghiệm + khu vực), chỉ tính trên
     * dữ liệu VND (không quy đổi ngoại tệ — ngoài phạm vi UC53), chỉ trả nhóm đạt đủ số mẫu tối thiểu
     * ({@code minSamples}) để bảo vệ ẩn danh. Dùng {@code PERCENTILE_CONT} (hàm PostgreSQL) tính
     * p25/median/p75; quy đổi sang đơn vị Triệu VNĐ (chia 1.000.000), cast {@code ::numeric} rồi làm
     * tròn 1 chữ số thập phân (PostgreSQL không có overload {@code ROUND(double precision, integer)}
     * — {@code PERCENTILE_CONT} trả {@code double precision}, phải cast sang {@code numeric} trước).
     * `job_title` được so khớp nhóm KHÔNG phân biệt hoa/thường + bỏ khoảng trắng thừa
     * (VD "Backend Developer" và "backend developer " được tính chung 1 nhóm) — chức danh là text tự
     * do khi đóng góp (UC50), nếu so khớp nguyên văn sẽ dễ tách nhầm thành nhiều nhóm nhỏ không đạt
     * ngưỡng mẫu tối thiểu dù cùng 1 vị trí thực tế. Giá trị hiển thị (`role`) lấy đại diện qua
     * {@code MIN()} trên bản ghi gốc (giữ nguyên hoa/thường của 1 lượt đóng góp bất kỳ trong nhóm).
     * <p>
     * Mỗi phần tử {@code Object[]} theo thứ tự: {@code [role(String), level(String), region(String),
     * samples(Long), p25(BigDecimal), median(BigDecimal), p75(BigDecimal)]}.
     *
     * @param minSamples Số mẫu tối thiểu để một nhóm được hiển thị
     * @return Danh sách nhóm thống kê, sắp xếp theo số mẫu giảm dần
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
    List<Object[]> findGroupedStatistics(@Param("minSamples") int minSamples);

    /**
     * Trung vị mức lương gộp/tháng trên toàn bộ dữ liệu VND (không nhóm), đơn vị Triệu VNĐ.
     *
     * @return Trung vị đã quy đổi, hoặc {@code null} nếu chưa có bản ghi VND nào
     */
    @Query(value = """
            SELECT ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gross_amount) / 1000000.0)::numeric, 1)
            FROM salary_contributions
            WHERE currency = 'VND'
            """, nativeQuery = true)
    BigDecimal findOverallMedianVnd();
}
