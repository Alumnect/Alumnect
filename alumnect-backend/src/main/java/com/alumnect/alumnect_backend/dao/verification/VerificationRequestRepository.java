package com.alumnect.alumnect_backend.dao.verification;

import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng verification_requests (Phiếu duyệt cựu sinh viên).
 */
@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long>, JpaSpecificationExecutor<VerificationRequest> {

    @Override
    @EntityGraph(attributePaths = {"user", "user.role", "reviewedBy", "major"})
    Page<VerificationRequest> findAll(@Nullable Specification<VerificationRequest> spec, Pageable pageable);

    /**
     * Tìm phiếu xác minh của một người dùng.
     *
     * @param user Đối tượng người dùng
     * @return Optional chứa phiếu xác minh
     */
    Optional<VerificationRequest> findByUser(User user);

    /**
     * Tìm phiếu yêu cầu xác minh/nâng cấp Cựu sinh viên mới nhất của người dùng theo ID.
     *
     * @param userId ID của người dùng
     * @return Optional chứa phiếu xác minh gần nhất
     */
    @EntityGraph(attributePaths = {"user", "user.role", "reviewedBy", "major"})
    Optional<VerificationRequest> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Kiểm tra xem người dùng có đang có phiếu yêu cầu ở trạng thái nhất định (VD: PENDING) hay không.
     *
     * @param userId ID của người dùng
     * @param status Trạng thái phiếu yêu cầu
     * @return true nếu đã tồn tại phiếu ở trạng thái đó
     */
    boolean existsByUserIdAndStatus(Long userId, VerificationStatus status);

    /**
     * Đếm số lượng phiếu yêu cầu theo trạng thái xét duyệt.
     *
     * @param status Trạng thái (PENDING, APPROVED, REJECTED)
     * @return Số lượng phiếu
     */
    long countByStatus(VerificationStatus status);
}
