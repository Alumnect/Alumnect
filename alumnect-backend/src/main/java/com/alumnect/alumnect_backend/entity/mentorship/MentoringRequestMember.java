package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Entity lưu snapshot danh sách thành viên thực sự tham gia vào một Mentoring Request dạng nhóm.
 * Độc lập với bảng mentoring_group_members, cố định danh sách tại thời điểm Submit Request.
 */
@Entity
@Table(name = "mentoring_request_members", uniqueConstraints =
        @UniqueConstraint(name = "uq_mentoring_request_member", columnNames = {"request_id", "user_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringRequestMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private MentoringRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();

    @PrePersist
    void prePersist() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }
}
