package com.alumnect.alumnect_backend.entity.event;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entity ánh xạ bảng event_registrations — thông tin đăng ký tham gia sự kiện (RSVP)
 * của sinh viên và cựu sinh viên (UC25 - Register to attend an event RSVP).
 * Ràng buộc UNIQUE (event_id, user_id) đảm bảo mỗi người dùng chỉ có 1 bản ghi RSVP cho mỗi sự kiện.
 */
@Entity
@Table(name = "event_registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistration {

    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Sự kiện được đăng ký */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** Người dùng đăng ký tham gia (Student hoặc Alumni) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Trạng thái đăng ký: REGISTERED hoặc CANCELLED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "REGISTERED";

    /** Thời điểm đăng ký tham gia */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
