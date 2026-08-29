package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên thực thể {@link Follow} (Quan hệ
 * theo dõi).
 */
@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    /**
     * Tìm mối quan hệ theo dõi cụ thể giữa follower và following.
     *
     * @param followerId  ID của người theo dõi
     * @param followingId ID của người được theo dõi
     * @return Optional chứa mối quan hệ theo dõi nếu tồn tại
     */
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * Kiểm tra xem một người dùng đã theo dõi một người dùng khác chưa.
     *
     * @param followerId  ID của người theo dõi
     * @param followingId ID của người được theo dõi
     * @return true nếu mối quan hệ theo dõi tồn tại, ngược lại false
     */
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * Lấy danh sách ID của tất cả người dùng mà một người đang theo dõi.
     *
     * @param followerId ID của người theo dõi
     * @return Danh sách ID người được theo dõi
     */
    @Query("SELECT f.following.id FROM Follow f WHERE f.follower.id = :followerId")
    List<Long> findFollowingIdsByFollowerId(@Param("followerId") Long followerId);


    /**
     * Tìm danh sách các mối quan hệ theo dõi giữa một người theo dõi và danh sách
     * những người được theo dõi.
     * Hỗ trợ tải hàng loạt (batch load) để tối ưu hóa truy vấn tránh lỗi N+1.
     *
     * @param followerId   ID của người theo dõi
     * @param followingIds Danh sách ID của những người được theo dõi
     * @return Danh sách các mối quan hệ theo dõi
     */
    List<Follow> findByFollowerIdAndFollowingIdIn(Long followerId, Collection<Long> followingIds);

    /**
     * Đếm số lượng người theo dõi (followers) của một người dùng.
     *
     * @param userId ID của người được theo dõi
     * @return Số lượng người theo dõi
     */
    long countByFollowingId(Long userId);

    /**
     * Đếm số lượng người theo dõi (followers) hàng loạt theo danh sách ID người dùng.
     * Trả về danh sách Object[] gồm [userId (Long), count (Long)].
     */
    @Query("SELECT f.following.id, COUNT(f) FROM Follow f WHERE f.following.id IN :userIds GROUP BY f.following.id")
    List<Object[]> countFollowersByUserIds(@Param("userIds") Collection<Long> userIds);

    /**
     * Đếm số lượng người mà một người dùng đang theo dõi (following).
     *
     * @param userId ID của người theo dõi
     * @return Số lượng người đang theo dõi
     */
    long countByFollowerId(Long userId);

    /**
     * Đếm số lượng người đang theo dõi (following) hàng loạt theo danh sách ID người dùng.
     * Trả về danh sách Object[] gồm [userId (Long), count (Long)].
     */
    @Query("SELECT f.follower.id, COUNT(f) FROM Follow f WHERE f.follower.id IN :userIds GROUP BY f.follower.id")
    List<Object[]> countFollowingByUserIds(@Param("userIds") Collection<Long> userIds);


    /**
     * Lấy danh sách những người đang theo dõi một người dùng (followers) có phân
     * trang.
     * Sử dụng EntityGraph để eager fetch thông tin follower, tránh lỗi N+1 query.
     *
     * @param followingId ID của người được theo dõi
     * @param pageable    Cấu hình phân trang
     * @return Trang chứa danh sách các mối quan hệ theo dõi
     */
    @EntityGraph(attributePaths = { "follower" })
    Page<Follow> findByFollowingId(Long followingId, Pageable pageable);

    /**
     * Lấy danh sách những người mà một người dùng đang theo dõi (following) có phân
     * trang.
     * Sử dụng EntityGraph để eager fetch thông tin following, tránh lỗi N+1 query.
     *
     * @param followerId ID của người theo dõi
     * @param pageable   Cấu hình phân trang
     * @return Trang chứa danh sách các mối quan hệ theo dõi
     */
    @EntityGraph(attributePaths = { "following" })
    Page<Follow> findByFollowerId(Long followerId, Pageable pageable);
}
