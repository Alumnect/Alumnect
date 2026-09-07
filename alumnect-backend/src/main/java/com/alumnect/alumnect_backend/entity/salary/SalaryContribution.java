package com.alumnect.alumnect_backend.entity.salary;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity ánh xạ bảng salary_contributions — một lượt đóng góp dữ liệu lương ẩn danh của cựu sinh viên
 * (UC50 - Contribute salary data). Chỉ Alumni đã đăng nhập mới đóng góp được; {@code user} được lưu để
 * cho phép chính chủ tự quản lý (sửa/xóa — UC51/UC52, ngoài phạm vi UC50) nhưng KHÔNG bao giờ trả về
 * qua API — Salary Board chỉ hiển thị số liệu tổng hợp (thống kê), giữ đúng cam kết ẩn danh.
 */
@Entity
@Table(name = "salary_contributions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryContribution {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người đóng góp — tham chiếu bảng users. KHÔNG được lộ ra ngoài API (ẩn danh). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Ngành nghề liên quan (tùy chọn) — tham chiếu bảng industries */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_id")
    private Industry industry;

    /** Chức danh công việc (VD: "Backend Developer") */
    @Column(name = "job_title", nullable = false, length = 150)
    private String jobTitle;

    /** Tên công ty (tùy chọn) */
    @Column(length = 150)
    private String company;

    /** Khu vực làm việc (tùy chọn, VD: "TP.HCM") */
    @Column(length = 120)
    private String region;

    /** Số năm kinh nghiệm (tùy chọn) */
    @Column(name = "years_experience")
    private Short yearsExperience;

    /** Mức lương gộp hàng tháng (bắt buộc, > 0) */
    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    /** Đơn vị tiền tệ (mã ISO 4217, mặc định "VND") */
    @Column(nullable = false, length = 3)
    private String currency;

    /** Thời điểm đóng góp, không thể cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật lần cuối (dùng cho UC51 - Edit salary contribution sau này) */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian tạo/mặc định khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (currency == null || currency.isBlank()) {
            currency = "VND";
        }
    }

    /** Tự động cập nhật thời gian mỗi khi bản ghi được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
