package com.alumnect.alumnect_backend.security.principal;

import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.entity.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;

/**
 * Lớp dịch vụ tải thông tin chi tiết người dùng phục vụ cho Spring Security xác thực.
 * Triển khai interface {@link UserDetailsService}.
 */
@Service
public class UserDetailServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Tải thông tin người dùng từ cơ sở dữ liệu qua Email (dùng làm Username).
     *
     * @param email Địa chỉ email đăng nhập
     * @return UserDetails chứa thông tin tài khoản và quyền hạn để Spring Security đối chiếu
     * @throws UsernameNotFoundException Nếu không tìm thấy người dùng tương ứng với email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        // Tạo danh sách quyền hạn (GrantedAuthority) dựa trên vai trò của người dùng
        // Spring Security yêu cầu vai trò có tiền tố "ROLE_"
        String roleName = user.getRole().getName();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleName);

        // Trả về đối tượng User của Spring Security
        // Tài khoản hợp lệ khi đã xác nhận email và trạng thái tài khoản là ACTIVE
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash() != null ? user.getPasswordHash() : "",
                user.isEmailVerified() && user.getAccountStatus() == com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE,
                true, // Tài khoản chưa hết hạn
                true, // Mật khẩu chưa hết hạn
                user.getAccountStatus() != com.alumnect.alumnect_backend.common.enums.AccountStatus.LOCKED, // Tài khoản không bị khóa
                Collections.singletonList(authority)
        );
    }
}
