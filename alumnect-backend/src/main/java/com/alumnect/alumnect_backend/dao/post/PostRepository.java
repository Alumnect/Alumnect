package com.alumnect.alumnect_backend.dao.post;

import com.alumnect.alumnect_backend.common.enums.PostType;
import com.alumnect.alumnect_backend.entity.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng posts (Bài viết bảng tin cộng đồng).
 */
@Repository
public interface PostRepository extends JpaRepository<Post, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Post> {

    /**
     * Lấy một trang bài viết cho bảng tin cộng đồng (UC15 - View community Feed), đã áp dụng:
     * <ul>
     *   <li>Loại trừ bài viết đã bị ẩn (isHidden = true) — BR-08/BR-11.</li>
     *   <li>Nếu người xem là Guest (guestMode = true), chỉ trả về bài viết PUBLIC — BR-12.</li>
     *   <li>Lọc theo loại bài viết nếu {@code type} khác null.</li>
     *   <li>Sắp xếp theo thời gian tạo mới nhất trước (JOIN FETCH tác giả để tránh N+1 query).</li>
     * </ul>
     *
     * @param guestMode true nếu người xem là Guest (chưa đăng nhập), false nếu đã đăng nhập
     * @param type      Loại bài viết cần lọc, hoặc null nếu không lọc theo loại
     * @param pageable  Thông tin phân trang (số trang, kích thước trang)
     * @return Trang kết quả các bài viết khớp điều kiện, đã kèm sẵn thông tin tác giả (User)
     */
    @Query("SELECT p FROM Post p JOIN FETCH p.user u " +
            "WHERE p.isHidden = false " +
            "AND (:guestMode = false OR p.visibility = com.alumnect.alumnect_backend.common.enums.PostVisibility.PUBLIC) " +
            "AND (:type IS NULL OR p.type = :type) " +
            "ORDER BY p.createdAt DESC")
    Page<Post> findFeed(@Param("guestMode") boolean guestMode, @Param("type") PostType type, Pageable pageable);

    /**
     * Lấy một bài viết theo ID cho màn hình chi tiết (UC16 - View Post Detail),
     * đã JOIN FETCH sẵn tác giả (User) để tránh N+1 query khi map sang response.
     * Không lọc {@code isHidden}/{@code visibility} ở tầng truy vấn — việc kiểm tra
     * quyền xem (BR-08/BR-11/BR-12) do tầng Service xử lý để trả đúng mã lỗi 404/403.
     *
     * @param id ID bài viết cần lấy
     * @return {@link Optional} chứa bài viết (kèm tác giả) nếu tồn tại
     */
    @Query("SELECT p FROM Post p JOIN FETCH p.user u WHERE p.id = :id")
    Optional<Post> findDetailById(@Param("id") Long id);
}
