package com.alumnect.alumnect_backend.dao.group;

import com.alumnect.alumnect_backend.entity.group.GroupPostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository thao tác với bảng group_post_comments (bình luận bài viết trong hội nhóm).
 */
@Repository
public interface GroupPostCommentRepository extends JpaRepository<GroupPostComment, Long> {

    /**
     * Lấy danh sách bình luận theo thứ tự thời gian tăng dần (cũ nhất trước).
     */
    @Query(value = "SELECT c FROM GroupPostComment c JOIN FETCH c.author WHERE c.post.id = :postId ORDER BY c.createdAt ASC",
            countQuery = "SELECT COUNT(c) FROM GroupPostComment c WHERE c.post.id = :postId")
    Page<GroupPostComment> findByPostIdOrderByCreatedAtAsc(@Param("postId") Long postId, Pageable pageable);

    @Query("SELECT c FROM GroupPostComment c JOIN FETCH c.author WHERE c.id = :id AND c.post.id = :postId")
    Optional<GroupPostComment> findByIdAndPostId(@Param("id") Long id, @Param("postId") Long postId);

    long countByParentComment_Id(Long parentId);
}
