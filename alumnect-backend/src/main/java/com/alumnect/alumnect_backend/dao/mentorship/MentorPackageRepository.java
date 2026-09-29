package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Interface DAO truy xuất dữ liệu gói Mentor (mentor_packages).
 */
@Repository
public interface MentorPackageRepository extends JpaRepository<MentorPackage, Long> {

    /**
     * Tìm danh sách các gói dịch vụ Mentor đang hoạt động (ACTIVE), sắp xếp theo thời hạn tăng dần.
     *
     * @param status Trạng thái gói (ACTIVE)
     * @return Danh sách gói dịch vụ khả dụng
     */
    List<MentorPackage> findByStatusOrderByDurationMonthsAsc(MentorPackageStatus status);

    /**
     * Tìm danh sách toàn bộ các gói dịch vụ Mentor (cả ACTIVE và INACTIVE), sắp xếp theo thời hạn tăng dần.
     *
     * @return Danh sách tất cả gói dịch vụ Mentor
     */
    List<MentorPackage> findAllByOrderByDurationMonthsAsc();

    /**
     * Tìm gói dịch vụ Mentor theo mã định danh duy nhất (code).
     *
     * @param code Mã gói dịch vụ (ví dụ: MENTOR_1M)
     * @return Optional chứa gói Mentor nếu tìm thấy
     */
    Optional<MentorPackage> findByCode(String code);
}
