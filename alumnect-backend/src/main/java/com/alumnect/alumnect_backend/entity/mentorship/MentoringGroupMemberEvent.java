package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberAction;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "mentoring_group_member_events")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MentoringGroupMemberEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "group_id", nullable = false) private MentoringGroup group;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "member_user_id", nullable = false) private User member;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "actor_id", nullable = false) private User actor;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private MentoringGroupMemberAction action;
    @Column(name = "created_at", nullable = false) @Builder.Default private Instant createdAt = Instant.now();
}
