package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn và lưu trữ phân phối yêu cầu Mentoring bảng mentoring_request_distributions (UC100).
 */
@Repository
public interface MentoringRequestDistributionRepository extends JpaRepository<MentoringRequestDistribution, Long> {

    /**
     * Kiểm tra xem một cặp Request - Mentor đã được tạo bản ghi phân phối hay chưa (phòng tránh trùng lặp BR-10).
     *
     * @param requestId ID yêu cầu
     * @param mentorProfileId ID hồ sơ Mentor
     * @return true nếu đã phân phối, false nếu chưa
     */
    boolean existsByRequestIdAndMentorProfileId(Long requestId, Long mentorProfileId);

    /**
     * Lấy danh sách các bản ghi phân phối của một yêu cầu.
     *
     * @param requestId ID yêu cầu
     * @return Danh sách các phân phối
     */
    List<MentoringRequestDistribution> findByRequestId(Long requestId);

    /**
     * Lấy danh sách yêu cầu phân phối tới một Mentor cụ thể theo thứ tự phân phối mới nhất.
     *
     * @param mentorProfileId ID hồ sơ Mentor
     * @return Danh sách các yêu cầu phân phối tới Mentor
     */
    List<MentoringRequestDistribution> findByMentorProfileIdOrderByDistributedAtDesc(Long mentorProfileId);

    /**
     * Đếm số lượng Mentor đã nhận được phân phối cho một yêu cầu cụ thể.
     *
     * @param requestId ID yêu cầu
     * @return Số lượng Mentor đã phân phối
     */
    long countByRequestId(Long requestId);
}
