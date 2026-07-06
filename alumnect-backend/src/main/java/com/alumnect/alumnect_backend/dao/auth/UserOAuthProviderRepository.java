package com.alumnect.alumnect_backend.dao.auth;

import com.alumnect.alumnect_backend.entity.auth.UserOAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository cung cấp các phương thức truy vấn bảng user_oauth_providers.
 */
@Repository
public interface UserOAuthProviderRepository extends JpaRepository<UserOAuthProvider, Long> {

    /**
     * Tìm liên kết OAuth theo nhà cung cấp và ID người dùng của nhà cung cấp.
     *
     * @param provider Tên nhà cung cấp (VD: "GOOGLE")
     * @param providerUserId ID người dùng của nhà cung cấp
     * @return Optional chứa thực thể UserOAuthProvider nếu tìm thấy
     */
    Optional<UserOAuthProvider> findByProviderAndProviderUserId(String provider, String providerUserId);

    /**
     * Kiểm tra sự tồn tại của liên kết OAuth.
     *
     * @param provider Tên nhà cung cấp (VD: "GOOGLE")
     * @param providerUserId ID người dùng của nhà cung cấp
     * @return true nếu đã tồn tại liên kết, ngược lại false
     */
    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);
}
