package com.alumnect.alumnect_backend.dao.auth;

import com.alumnect.alumnect_backend.entity.auth.VerificationToken;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.common.enums.VerificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng verification_tokens (Mã xác thực/OTP).
 */
@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    /**
     * Tìm kiếm mã OTP/Token trong cơ sở dữ liệu.
     *
     * @param token Chuỗi mã OTP 6 số cần tìm
     * @return Optional chứa thông tin Token nếu tìm thấy
     */
    Optional<VerificationToken> findByToken(String token);

    /**
     * Tìm mã OTP mới nhất của người dùng dựa theo loại xác thực.
     *
     * @param user Đối tượng người dùng
     * @param type Loại xác thực (EMAIL_VERIFICATION hoặc PASSWORD_RESET)
     * @return Optional chứa mã OTP mới nhất
     */
    Optional<VerificationToken> findFirstByUserAndTypeOrderByCreatedAtDesc(User user, VerificationType type);

    /**
     * Đếm số lượng mã OTP đã sinh ra cho người dùng kể từ một thời điểm cụ thể.
     * Dùng để giới hạn số lần gửi OTP tối đa trong ngày.
     *
     * @param user Đối tượng người dùng
     * @param type Loại xác thực
     * @param since Thời điểm bắt đầu tính
     * @return Số lượng mã OTP đã gửi
     */
    int countByUserAndTypeAndCreatedAtAfter(User user, VerificationType type, Instant since);

    /**
     * Xóa tất cả các token đã hết hạn hoặc đã được sử dụng thành công khỏi cơ sở dữ liệu.
     * Thường được gọi bởi bộ lập lịch định kỳ để dọn dẹp dung lượng.
     *
     * @param now Thời điểm hiện tại để so sánh hết hạn
     * @return Số lượng bản ghi đã xóa thành công
     */
    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.expiresAt < :now OR vt.used = true")
    int deleteExpiredOrUsed(Instant now);

    /**
     * Vô hiệu hóa các mã OTP cũ chưa sử dụng của một người dùng.
     *
     * @param user Đối tượng người dùng
     * @param type Loại xác thực
     */
    @Modifying
    @Query("UPDATE VerificationToken vt SET vt.used = true WHERE vt.user = :user AND vt.type = :type AND vt.used = false")
    void invalidateOldTokens(User user, VerificationType type);
}
