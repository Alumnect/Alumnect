package com.alumnect.alumnect_backend.dao.post;

import com.alumnect.alumnect_backend.entity.post.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng post_likes (lượt thích bài viết — UC17).
 */
@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /**
     * Kiểm tra một người dùng đã thích một bài viết hay chưa.
     *
     * @param postId ID bài viết
     * @param userId ID người dùng
     * @return true nếu đã tồn tại lượt thích
     */
    boolean existsByPostIdAndUserId(Long postId, Long userId);

    /**
     * Xóa lượt thích của một người dùng cho một bài viết (dùng khi bỏ thích).
     *
     * @param postId ID bài viết
     * @param userId ID người dùng
     */
    void deleteByPostIdAndUserId(Long postId, Long userId);

    /**
     * Lấy danh sách ID các bài viết (trong một tập cho trước) mà người dùng đã thích —
     * dùng để tính cờ {@code liked} theo lô (batch) khi hiển thị bảng tin, tránh N+1 query.
     *
     * @param userId  ID người xem hiện tại
     * @param postIds Tập ID bài viết cần kiểm tra
     * @return Danh sách ID bài viết mà người dùng đã thích
     */
    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user.id = :userId AND pl.post.id IN :postIds")
    List<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);
}
