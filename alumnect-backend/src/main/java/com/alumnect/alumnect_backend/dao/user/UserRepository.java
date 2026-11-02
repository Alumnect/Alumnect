package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng users (Tài khoản người dùng).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /**
     * Tìm kiếm người dùng bằng địa chỉ email.
     *
     * @param email Địa chỉ email cần tìm
     * @return Optional chứa thông tin người dùng nếu tìm thấy
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra xem địa chỉ email đã tồn tại trong hệ thống chưa.
     *
     * @param email Địa chỉ email cần kiểm tra
     * @return true nếu email đã tồn tại, ngược lại false
     */
    boolean existsByEmail(String email);

    /**
     * Đếm số lượng người dùng theo tên vai trò.
     *
     * @param roleName Tên vai trò (STUDENT, ALUMNI, ADMIN)
     * @return Số lượng người dùng
     */
    long countByRoleName(String roleName);

    /**
     * Đếm số lượng người dùng theo trạng thái tài khoản.
     *
     * @param accountStatus Trạng thái tài khoản
     * @return Số lượng người dùng
     */
    long countByAccountStatus(AccountStatus accountStatus);

    /**
     * Lấy danh sách người dùng theo vai trò và trạng thái tài khoản.
     */
    List<User> findByRoleNameAndAccountStatus(String roleName, AccountStatus accountStatus);

    /**
     * Lấy danh sách người dùng theo trạng thái tài khoản.
     */
    List<User> findByAccountStatus(AccountStatus accountStatus);

    /**
     * Thống kê số lượng đăng ký tài khoản mới theo ngày trong khoảng thời gian.
     *
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Danh sách mảng đối tượng [ngày, số lượng]
     */
    @Query("SELECT CAST(u.createdAt AS date) as regDate, COUNT(u.id) as regCount " +
           "FROM User u " +
           "WHERE u.createdAt >= :startDate AND u.createdAt <= :endDate " +
           "GROUP BY CAST(u.createdAt AS date) " +
           "ORDER BY regDate ASC")
    List<Object[]> countRegistrationsByDayInRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    /**
     * Thống kê số lượng đăng ký tài khoản mới theo tháng trong năm từ CSDL.
     */
    @Query("SELECT EXTRACT(MONTH FROM u.createdAt) as regMonth, COUNT(u.id) as regCount " +
           "FROM User u " +
           "WHERE u.createdAt >= :startDate AND u.createdAt <= :endDate " +
           "GROUP BY EXTRACT(MONTH FROM u.createdAt) " +
           "ORDER BY regMonth ASC")
    List<Object[]> countRegistrationsByMonthInRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    /**
     * Thống kê số lượng đăng ký tài khoản mới theo các năm từ CSDL.
     */
    @Query("SELECT EXTRACT(YEAR FROM u.createdAt) as regYear, COUNT(u.id) as regCount " +
           "FROM User u " +
           "GROUP BY EXTRACT(YEAR FROM u.createdAt) " +
           "ORDER BY regYear ASC")
    List<Object[]> countRegistrationsByYear();

    /**
     * Tìm kiếm danh sách ứng viên đề xuất kết nối cho người dùng đã đăng nhập (Có phân trang / Limit).
     * Loại bỏ tài khoản không hoạt động, chính mình và các tài khoản đã follow.
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile up " +
           "LEFT JOIN FETCH up.major m " +
           "WHERE u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE " +
           "AND u.id != :currentUserId " +
           "AND u.role.name != 'ADMIN' " +
           "AND u.id NOT IN :excludedIds " +
           "ORDER BY u.isAccountVerified DESC, u.createdAt DESC")
    List<User> findCandidatesForSuggestions(
            @Param("currentUserId") Long currentUserId,
            @Param("excludedIds") Collection<Long> excludedIds,
            Pageable pageable
    );

    /**
     * Tìm kiếm danh sách cựu sinh viên tiêu biểu cho khách vãng lai (Có phân trang / Limit).
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile up " +
           "LEFT JOIN FETCH up.major m " +
           "WHERE u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE " +
           "AND u.role.name != 'ADMIN' " +
           "ORDER BY u.isAccountVerified DESC, u.createdAt DESC")
    List<User> findGuestCandidates(Pageable pageable);

}


