package com.alumnect.alumnect_backend.dao.post;

import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.entity.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

    @Query(value = "SELECT DISTINCT p FROM Post p JOIN FETCH p.author u LEFT JOIN FETCH p.mediaList " +
            "WHERE p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE " +
            "AND (:category IS NULL OR p.category = :category) " +
            "ORDER BY p.isPinned DESC, p.createdAt DESC",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p JOIN p.author u " +
            "WHERE p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE " +
            "AND (:category IS NULL OR p.category = :category)")
    Page<Post> findFeed(@Param("guestMode") boolean guestMode, @Param("category") PostCategory category, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN FETCH p.author u LEFT JOIN FETCH p.mediaList WHERE p.id = :id")
    Optional<Post> findDetailById(@Param("id") Long id);

    @Query(value = "SELECT DISTINCT p FROM Post p JOIN FETCH p.author u LEFT JOIN FETCH p.mediaList " +
            "WHERE u.id = :authorId AND p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE " +
            "AND (:category IS NULL OR p.category = :category) " +
            "ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p JOIN p.author u " +
            "WHERE u.id = :authorId AND p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE " +
            "AND (:category IS NULL OR p.category = :category)")
    Page<Post> findByAuthorIdAndCategory(@Param("authorId") Long authorId, @Param("category") PostCategory category, Pageable pageable);
}
