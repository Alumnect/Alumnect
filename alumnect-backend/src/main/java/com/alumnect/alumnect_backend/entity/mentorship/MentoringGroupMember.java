package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "mentoring_group_members", uniqueConstraints =
        @UniqueConstraint(name = "uq_mentoring_group_member", columnNames = {"group_id", "user_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MentoringGroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "group_id", nullable = false) private MentoringGroup group;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "invited_by", nullable = false) private User invitedBy;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private MentoringGroupMemberStatus status;
    @Column(name = "invited_at", nullable = false) @Builder.Default private Instant invitedAt = Instant.now();
    @Column(name = "joined_at") private Instant joinedAt;
    @Column(name = "removed_at") private Instant removedAt;
    @Column(name = "updated_at", nullable = false) @Builder.Default private Instant updatedAt = Instant.now();
    @PreUpdate void update() { updatedAt = Instant.now(); }
}
