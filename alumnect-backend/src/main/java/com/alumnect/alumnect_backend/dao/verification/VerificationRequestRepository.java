package com.alumnect.alumnect_backend.dao.verification;

import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng verification_requests (Phiếu duyệt cựu sinh viên).
 */
@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    /**
     * Tìm phiếu xác minh của một người dùng.
     *
     * @param user Đối tượng người dùng
     * @return Optional chứa phiếu xác minh
     */
    Optional<VerificationRequest> findByUser(User user);
}
