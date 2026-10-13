package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn và lưu trữ dữ liệu bảng mentoring_requests (UC100, UC101).
 */
@Repository
public interface MentoringRequestRepository extends JpaRepository<MentoringRequest, Long>, JpaSpecificationExecutor<MentoringRequest> {

    /**
     * Lấy danh sách yêu cầu Mentoring do sinh viên tạo theo thứ tự mới nhất.
     *
     * @param studentId ID tài khoản sinh viên
     * @return Danh sách yêu cầu mentoring
     */
    List<MentoringRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    /**
     * Lấy danh sách yêu cầu Mentoring do sinh viên tạo có phân trang.
     *
     * @param studentId ID tài khoản sinh viên
     * @param pageable Đối tượng phân trang
     * @return Trang danh sách yêu cầu
     */
    Page<MentoringRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

    /**
     * Lấy danh sách yêu cầu Mentoring do sinh viên tạo lọc theo loại yêu cầu (GENERAL hoặc DIRECT).
     *
     * @param studentId ID tài khoản sinh viên
     * @param requestType Loại yêu cầu
     * @param pageable Đối tượng phân trang
     * @return Trang danh sách yêu cầu
     */
    Page<MentoringRequest> findByStudentIdAndRequestTypeOrderByCreatedAtDesc(Long studentId, MentoringRequestType requestType, Pageable pageable);

    /**
     * Lấy danh sách yêu cầu gửi trực tiếp tới một Mentor cụ thể (UC101, phục vụ UC102 tiếp theo).
     *
     * @param targetMentorId ID hồ sơ Mentor nhận yêu cầu
     * @param pageable Đối tượng phân trang
     * @return Trang danh sách yêu cầu gửi trực tiếp tới Mentor
     */
    Page<MentoringRequest> findByTargetMentorIdOrderByCreatedAtDesc(Long targetMentorId, Pageable pageable);

    /**
     * Tìm chi tiết một yêu cầu mentoring theo ID và studentId của chủ sở hữu.
     *
     * @param id ID yêu cầu
     * @param studentId ID sinh viên sở hữu
     * @return Optional chứa MentoringRequest nếu tìm thấy
     */
    Optional<MentoringRequest> findByIdAndStudentId(Long id, Long studentId);

    /**
     * Khóa bi quan (SELECT ... FOR UPDATE) bản ghi Request để tuần tự hóa các thao tác làm thay đổi
     * trạng thái chọn Mentor: Mentor ACCEPT, tạo Deal Ticket, xác nhận Deal và kích hoạt Task sau thanh toán.
     *
     * @param id ID của Request
     * @return Request đã được khóa ghi trong transaction hiện tại
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM MentoringRequest r WHERE r.id = :id")
    Optional<MentoringRequest> findByIdForUpdate(@Param("id") Long id);
}
