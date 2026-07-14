package com.alumnect.alumnect_backend.dao.post;

import com.alumnect.alumnect_backend.entity.post.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng comments (Bình luận của bài viết).
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /**
     * Lấy một trang bình luận đang hiển thị (status = ACTIVE) của một bài viết (UC16 - View Post Detail).
     * Đã JOIN FETCH sẵn tác giả (User) để tránh N+1 query, sắp xếp theo thời gian tạo cũ→mới
     * (thứ tự đọc tự nhiên của một luồng bình luận).
     *
     * @param postId   ID bài viết cần lấy bình luận
     * @param pageable Thông tin phân trang (số trang, kích thước trang)
     * @return Trang kết quả các bình luận ACTIVE của bài viết, đã kèm sẵn thông tin tác giả (User)
     */
    @Query("SELECT c FROM Comment c JOIN FETCH c.user u " +
            "WHERE c.post.id = :postId " +
            "AND c.status = com.alumnect.alumnect_backend.common.enums.CommentStatus.ACTIVE " +
            "ORDER BY c.createdAt ASC")
    Page<Comment> findActiveByPostId(@Param("postId") Long postId, Pageable pageable);
}
