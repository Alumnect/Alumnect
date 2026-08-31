package com.alumnect.alumnect_backend.dao.post;

import com.alumnect.alumnect_backend.entity.post.PostSave;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng post_saves (lượt lưu bài viết — UC20).
 */
@Repository
public interface PostSaveRepository extends JpaRepository<PostSave, Long> {

    /**
     * Kiểm tra một người dùng đã lưu một bài viết hay chưa.
     *
     * @param postId ID bài viết
     * @param userId ID người dùng
     * @return true nếu bài viết đã được lưu
     */
    boolean existsByPostIdAndUserId(Long postId, Long userId);

    /**
     * Xóa lượt lưu bài viết của một người dùng (dùng khi bỏ lưu).
     *
     * @param postId ID bài viết
     * @param userId ID người dùng
     */
    void deleteByPostIdAndUserId(Long postId, Long userId);

    /**
     * Lấy danh sách ID các bài viết (trong tập danh sách cho trước) mà người dùng đã lưu.
     * Dùng để tính cờ {@code saved} theo lô (batch-fetch) khi hiển thị bảng tin hoặc chi tiết, tránh N+1 query.
     *
     * @param userId  ID người xem hiện tại
     * @param postIds Tập ID bài viết cần kiểm tra
     * @return Danh sách ID bài viết mà người dùng đã lưu
     */
    @Query("SELECT ps.post.id FROM PostSave ps WHERE ps.user.id = :userId AND ps.post.id IN :postIds")
    List<Long> findSavedPostIds(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);

    /**
     * Lấy danh sách các bản ghi lưu bài viết còn hiệu lực (bài viết có trạng thái ACTIVE) của một người dùng,
     * sắp xếp theo thời gian lưu mới nhất trước.
     *
     * @param userId   ID người dùng
     * @param pageable Thông tin phân trang
     * @return Trang danh sách các bản ghi PostSave kèm bài viết và tác giả
     */
    @Query(value = "SELECT ps FROM PostSave ps JOIN FETCH ps.post p JOIN FETCH p.author u " +
            "WHERE ps.user.id = :userId AND p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE " +
            "ORDER BY ps.createdAt DESC",
            countQuery = "SELECT COUNT(ps) FROM PostSave ps JOIN ps.post p " +
            "WHERE ps.user.id = :userId AND p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE")
    Page<PostSave> findActiveSavedPostsByUserId(@Param("userId") Long userId, Pageable pageable);
}
