package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserProjection;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng user_profiles (Thông tin cá nhân người dùng).
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    /** Kiểm tra mã số sinh viên đã tồn tại chưa (dùng khi đăng ký tài khoản mới tinh) */
    boolean existsByStudentCodeIgnoreCase(String studentCode);

    /** Kiểm tra mã số sinh viên đã tồn tại ở tài khoản khác chưa (dùng khi đăng ký đè/sửa tài khoản PENDING của chính mình) */
    boolean existsByStudentCodeIgnoreCaseAndUserIdNot(String studentCode, Long userId);

    /** Lấy danh sách tất cả các khóa học (Cohort) duy nhất của các tài khoản ACTIVE */
    @Query("SELECT DISTINCT up.cohort FROM UserProfile up WHERE up.cohort IS NOT NULL AND up.user.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE AND up.user.role.name != 'ADMIN' ORDER BY up.cohort DESC")
    List<Integer> findDistinctCohorts();

    /** Lấy danh sách tất cả các tỉnh / thành phố duy nhất của các tài khoản ACTIVE */
    @Query("SELECT DISTINCT up.city FROM UserProfile up WHERE up.city IS NOT NULL AND TRIM(up.city) != '' AND up.user.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE AND up.user.role.name != 'ADMIN' ORDER BY up.city ASC")
    List<String> findDistinctCities();

    /**
     * Tìm kiếm người dùng cho chức năng chat / tạo nhóm.
     * Khớp chính xác tên theo word boundary hoặc email, ưu tiên người đang follow lên đầu.
     */
    @Query(value = """
        SELECT p.user_id AS userId,
               u.email AS email,
               p.full_name AS fullName,
               p.avatar_url AS avatarUrl,
               p.headline AS headline,
               m.name AS major,
               CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS isFollowing
        FROM user_profiles p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN majors m ON p.major_id = m.id
        LEFT JOIN follows f ON f.follower_id = :currentUserId AND f.following_id = p.user_id
        WHERE u.account_status = 'ACTIVE'
          AND u.id != :currentUserId
          AND (
            :keyword IS NULL OR :keyword = ''
            OR unaccent(lower(p.full_name)) ILIKE :startPattern
            OR unaccent(lower(p.full_name)) ILIKE :wordPattern
            OR lower(u.email) LIKE :emailPattern
          )
        ORDER BY
          CASE WHEN f.follower_id IS NOT NULL THEN 0 ELSE 1 END ASC,
          p.full_name ASC
        LIMIT :limit
    """, nativeQuery = true)
    List<ChatUserProjection> searchUsersForChatNative(
            @Param("currentUserId") Long currentUserId,
            @Param("keyword") String keyword,
            @Param("startPattern") String startPattern,
            @Param("wordPattern") String wordPattern,
            @Param("emailPattern") String emailPattern,
            @Param("limit") int limit
    );
}


