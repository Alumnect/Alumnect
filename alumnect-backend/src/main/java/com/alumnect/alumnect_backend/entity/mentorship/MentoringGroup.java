package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "mentoring_groups")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MentoringGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 200) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "leader_id", nullable = false) private User leader;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default
    private MentoringGroupStatus status = MentoringGroupStatus.ACTIVE;
    @Version private Long version;
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default private List<MentoringGroupMember> members = new ArrayList<>();
    @Column(name = "created_at", nullable = false) @Builder.Default private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) @Builder.Default private Instant updatedAt = Instant.now();
    @PrePersist void create() { if (createdAt == null) createdAt = Instant.now(); updatedAt = Instant.now(); }
    @PreUpdate void update() { updatedAt = Instant.now(); }
}
