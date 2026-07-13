package com.alumnect.alumnect_backend.entity.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng user_skills — lưu các kỹ năng của người dùng theo nhóm.
 */
@Entity
@Table(name = "user_skills", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_skills_user_id_group_name_skill_name", columnNames = {"user_id", "group_name", "skill_name"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "group_name", nullable = false, length = 80)
    private String groupName;

    @Column(name = "skill_name", nullable = false, length = 80)
    private String skillName;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
