package com.alumnect.alumnect_backend.dao.group;

import com.alumnect.alumnect_backend.entity.group.GroupPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository thao tác với bảng group_posts (bài viết / thảo luận trong hội nhóm).
 */
@Repository
public interface GroupPostRepository extends JpaRepository<GroupPost, Long> {

    /**
     * Lấy danh sách bài viết trong nhóm theo thứ tự: bài ghim lên đầu, sau đó đến bài mới nhất.
     */
    @Query(value = "SELECT p FROM GroupPost p JOIN FETCH p.author WHERE p.group.id = :groupId ORDER BY p.isPinned DESC, p.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM GroupPost p WHERE p.group.id = :groupId")
    Page<GroupPost> findByGroupIdOrderByPinnedAndRecent(@Param("groupId") Long groupId, Pageable pageable);

    @Query(value = "SELECT p FROM GroupPost p JOIN FETCH p.author WHERE p.group.id = :groupId AND p.topic = :topic ORDER BY p.isPinned DESC, p.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM GroupPost p WHERE p.group.id = :groupId AND p.topic = :topic")
    Page<GroupPost> findByGroupIdAndTopicOrderByPinnedAndRecent(@Param("groupId") Long groupId,
                                                                 @Param("topic") String topic, Pageable pageable);

    /**
     * Tìm bài viết theo ID và Group ID kèm thông tin tác giả.
     */
    @Query("SELECT p FROM GroupPost p JOIN FETCH p.author WHERE p.id = :id AND p.group.id = :groupId")
    Optional<GroupPost> findByIdAndGroupId(@Param("id") Long id, @Param("groupId") Long groupId);

    /**
     * Tăng số lượt thích của bài viết một cách nguyên tử.
     */
    @Modifying
    @Query("UPDATE GroupPost p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    void incrementLikeCount(@Param("postId") Long postId);

    /**
     * Giảm số lượt thích của bài viết một cách nguyên tử (kẹp sàn 0).
     */
    @Modifying
    @Query("UPDATE GroupPost p SET p.likeCount = CASE WHEN p.likeCount > 0 THEN p.likeCount - 1 ELSE 0 END WHERE p.id = :postId")
    void decrementLikeCount(@Param("postId") Long postId);

    /**
     * Tăng số lượng bình luận của bài viết một cách nguyên tử.
     */
    @Modifying
    @Query("UPDATE GroupPost p SET p.commentCount = p.commentCount + 1 WHERE p.id = :postId")
    void incrementCommentCount(@Param("postId") Long postId);

    /**
     * Giảm số lượng bình luận của bài viết một cách nguyên tử (kẹp sàn 0).
     */
    @Modifying
    @Query("UPDATE GroupPost p SET p.commentCount = CASE WHEN p.commentCount > :count THEN p.commentCount - :count ELSE 0 END WHERE p.id = :postId")
    void decrementCommentCount(@Param("postId") Long postId, @Param("count") int count);

    /**
     * Đếm tổng số bài viết trong hội nhóm.
     */
    long countByGroupId(Long groupId);
}
