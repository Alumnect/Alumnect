package com.alumnect.alumnect_backend.dao.auth;

import com.alumnect.alumnect_backend.entity.auth.RefreshToken;
import com.alumnect.alumnect_backend.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng refresh_tokens.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Tìm kiếm thông tin Refresh Token bằng mã băm token.
     *
     * @param tokenHash Chuỗi mã băm SHA-256 của token cần tìm
     * @return Optional chứa thông tin RefreshToken nếu tìm thấy
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Xóa tất cả các refresh token liên kết với một người dùng cụ thể.
     * Thường dùng khi người dùng đăng xuất toàn bộ thiết bị hoặc thay đổi mật khẩu.
     *
     * @param user Đối tượng người dùng cần xóa token
     */
    void deleteByUser(User user);
}
