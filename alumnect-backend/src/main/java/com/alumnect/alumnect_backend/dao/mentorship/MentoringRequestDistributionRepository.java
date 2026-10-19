package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn và lưu trữ phân phối yêu cầu Mentoring bảng mentoring_request_distributions (UC100, UC101, UC102, UC103).
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
     * Tìm bản ghi phân phối của một yêu cầu gửi tới một Mentor cụ thể (UC103).
     *
     * @param requestId ID yêu cầu
     * @param mentorProfileId ID hồ sơ Mentor
     * @return Optional chứa bản ghi phân phối nếu tồn tại
     */
    Optional<MentoringRequestDistribution> findByRequestIdAndMentorProfileId(Long requestId, Long mentorProfileId);

    /**
     * Lấy danh sách các bản ghi phân phối của một yêu cầu sắp xếp theo thời điểm gửi tăng dần.
     *
     * @param requestId ID yêu cầu
     * @return Danh sách các phân phối theo thứ tự thời gian
     */
    List<MentoringRequestDistribution> findByRequestIdOrderByDistributedAtAsc(Long requestId);

    /**
     * Lấy danh sách các bản ghi phân phối cho nhiều yêu cầu (Batch query tối ưu cho danh sách).
     *
     * @param requestIds Danh sách ID các yêu cầu
     * @return Danh sách phân phối
     */
    List<MentoringRequestDistribution> findByRequestIdIn(java.util.Collection<Long> requestIds);

    /**
     * Lấy phản hồi/phân phối của Mentor hiện tại cho một trang Request.
     * Request GENERAL chưa từng được Mentor phản hồi có thể không có bản ghi tương ứng.
     */
    @Query("SELECT d FROM MentoringRequestDistribution d " +
            "WHERE d.request.id IN :requestIds AND d.mentorProfile.id = :mentorProfileId")
    List<MentoringRequestDistribution> findByRequestIdsAndMentorProfileId(
            @Param("requestIds") java.util.Collection<Long> requestIds,
            @Param("mentorProfileId") Long mentorProfileId);

    /**
     * Đếm số lượng Mentor đã nhận được phân phối cho một yêu cầu cụ thể.
     *
     * @param requestId ID yêu cầu
     * @return Số lượng Mentor đã phân phối
     */
    long countByRequestId(Long requestId);

    /**
     * Khóa bi quan bản ghi phản hồi (Request - Mentor) để Mentor ACCEPT/DECLINE idempotent khi bị gọi lặp.
     *
     * @param requestId ID của Request
     * @param mentorProfileId ID hồ sơ Mentor
     * @return Bản ghi phân phối đã khóa ghi
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM MentoringRequestDistribution d WHERE d.request.id = :requestId AND d.mentorProfile.id = :mentorProfileId")
    Optional<MentoringRequestDistribution> findForUpdate(@Param("requestId") Long requestId,
                                                         @Param("mentorProfileId") Long mentorProfileId);

    /**
     * Tìm phản hồi của một Mentor (theo users.id) đối với Request.
     *
     * @param requestId ID của Request
     * @param mentorUserId ID tài khoản người dùng của Mentor
     * @return Bản ghi phân phối nếu Request đã được gửi tới Mentor này
     */
    @Query("SELECT d FROM MentoringRequestDistribution d WHERE d.request.id = :requestId AND d.mentorProfile.user.id = :mentorUserId")
    Optional<MentoringRequestDistribution> findByRequestIdAndMentorUserId(@Param("requestId") Long requestId,
                                                                          @Param("mentorUserId") Long mentorUserId);

    /**
     * Lấy các phản hồi của Request theo trạng thái (dùng để chuyển các phản hồi đang chờ sang EXPIRED khi Request đã chọn Mentor).
     *
     * @param requestId ID của Request
     * @param status Trạng thái phản hồi cần lọc
     * @return Danh sách phản hồi
     */
    List<MentoringRequestDistribution> findByRequestIdAndStatus(Long requestId, MentoringDistributionStatus status);

    /**
     * Tìm kiếm và phân trang các yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới Mentor cụ thể (UC103).
     * Hỗ trợ lọc tùy chọn theo trạng thái phân phối (status) và loại yêu cầu (requestType).
     * Tối ưu hóa hiệu năng bằng cách JOIN FETCH thông tin request, industry và student.
     *
     * @param mentorProfileId ID hồ sơ Mentor
     * @param status Trạng thái phân phối (tùy chọn)
     * @param requestType Loại yêu cầu GENERAL/DIRECT (tùy chọn)
     * @param pageable Tham số phân trang
     * @return Trang danh sách các bản ghi phân phối
     */
    @Query(
        value = "SELECT d FROM MentoringRequestDistribution d " +
                "JOIN FETCH d.request r " +
                "JOIN FETCH r.industry i " +
                "JOIN FETCH r.student s " +
                "WHERE d.mentorProfile.id = :mentorProfileId " +
                "AND (:status IS NULL OR d.status = :status) " +
                "AND (:requestType IS NULL OR r.requestType = :requestType) " +
                "ORDER BY d.distributedAt DESC",
        countQuery = "SELECT COUNT(d) FROM MentoringRequestDistribution d " +
                     "JOIN d.request r " +
                     "WHERE d.mentorProfile.id = :mentorProfileId " +
                     "AND (:status IS NULL OR d.status = :status) " +
                     "AND (:requestType IS NULL OR r.requestType = :requestType)"
    )
    Page<MentoringRequestDistribution> findIncomingRequests(
        @Param("mentorProfileId") Long mentorProfileId,
        @Param("status") MentoringDistributionStatus status,
        @Param("requestType") MentoringRequestType requestType,
        Pageable pageable
    );
}
