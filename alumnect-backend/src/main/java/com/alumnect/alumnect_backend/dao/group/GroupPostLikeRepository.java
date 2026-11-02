package com.alumnect.alumnect_backend.dao.group;

import com.alumnect.alumnect_backend.entity.group.GroupPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository thao tác với bảng group_post_likes (lượt thích bài viết trong hội nhóm).
 */
@Repository
public interface GroupPostLikeRepository extends JpaRepository<GroupPostLike, Long> {

    Optional<GroupPostLike> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    void deleteByPostIdAndUserId(Long postId, Long userId);

    /**
     * Lấy danh sách lượt thích của người dùng trên tập các bài viết để xác định likedByViewer hàng loạt.
     */
    @Query("SELECT l FROM GroupPostLike l WHERE l.user.id = :userId AND l.post.id IN :postIds")
    List<GroupPostLike> findByUserIdAndPostIdIn(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);
}
