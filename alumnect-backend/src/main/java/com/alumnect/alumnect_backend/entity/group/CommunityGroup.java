package com.alumnect.alumnect_backend.entity.group;

import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
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
import java.util.List;

/**
 * Entity ánh xạ bảng community_groups — hội nhóm cộng đồng.
 * {@code memberCount} chỉ được thay đổi bằng các query {@code @Modifying} trong CommunityGroupRepository;
 * {@link DynamicUpdate} đảm bảo khi sửa các trường khác Hibernate chỉ UPDATE đúng cột đã đổi, không ghi đè
 * member_count bằng giá trị cũ (tránh mất cập nhật khi có người tham gia/rời nhóm đồng thời).
 */
@Entity
@Table(name = "community_groups")
@DynamicUpdate
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    /** Khóa danh mục hoạt động (technology, sports, ...) — xem GroupCategories */
    @Column(nullable = false, length = 50)
    private String category;

    /** Chủ đề / sở thích liên quan (tối đa 5) */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "topics", columnDefinition = "varchar(50)[]")
    private List<String> topics;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private GroupPrivacy privacy = GroupPrivacy.PUBLIC;

    /** Quy định tham gia (không bắt buộc) */
    @Column(name = "join_rules", columnDefinition = "TEXT")
    private String joinRules;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private int memberCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GroupStatus status = GroupStatus.ACTIVE;

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
