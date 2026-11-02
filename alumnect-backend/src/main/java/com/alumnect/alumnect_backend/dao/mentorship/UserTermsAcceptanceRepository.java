package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.UserTermsAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository truy xuất và thao tác dữ liệu bảng user_terms_acceptances.
 * Cung cấp các phương thức kiểm tra và tìm kiếm bản ghi chấp nhận điều khoản theo user_id và terms_version.
 */
@Repository
public interface UserTermsAcceptanceRepository extends JpaRepository<UserTermsAcceptance, Long> {

    /**
     * Kiểm tra người dùng đã chấp nhận điều khoản tại một phiên bản cụ thể hay chưa.
     *
     * @param userId ID của người dùng cần kiểm tra
     * @param termsVersion Phiên bản điều khoản (ví dụ: 1.0)
     * @return true nếu đã có bản ghi chấp nhận tương ứng trong cơ sở dữ liệu, ngược lại false
     */
    boolean existsByUserIdAndTermsVersion(Long userId, String termsVersion);

    /**
     * Tìm bản ghi chấp nhận điều khoản của người dùng theo phiên bản cụ thể.
     *
     * @param userId ID của người dùng
     * @param termsVersion Phiên bản điều khoản (ví dụ: 1.0)
     * @return Optional chứa đối tượng UserTermsAcceptance nếu tồn tại
     */
    Optional<UserTermsAcceptance> findByUserIdAndTermsVersion(Long userId, String termsVersion);
}
