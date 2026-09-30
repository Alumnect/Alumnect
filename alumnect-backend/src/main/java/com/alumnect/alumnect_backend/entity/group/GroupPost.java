package com.alumnect.alumnect_backend.entity.group;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng group_posts — bài viết / thảo luận trong hội nhóm.
 */
@Entity
@Table(name = "group_posts")
@DynamicUpdate
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CommunityGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "topic", length = 50)
    private String topic;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "image_urls", columnDefinition = "varchar(500)[]")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "video_urls", columnDefinition = "varchar(500)[]")
    @Builder.Default
    private List<String> videoUrls = new ArrayList<>();

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private int likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private int commentCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
