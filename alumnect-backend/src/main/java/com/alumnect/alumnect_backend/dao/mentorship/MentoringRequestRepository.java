package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn và lưu trữ dữ liệu bảng mentoring_requests (UC100).
 */
@Repository
public interface MentoringRequestRepository extends JpaRepository<MentoringRequest, Long> {

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
     * Tìm chi tiết một yêu cầu mentoring theo ID và studentId của chủ sở hữu.
     *
     * @param id ID yêu cầu
     * @param studentId ID sinh viên sở hữu
     * @return Optional chứa MentoringRequest nếu tìm thấy
     */
    Optional<MentoringRequest> findByIdAndStudentId(Long id, Long studentId);
}
