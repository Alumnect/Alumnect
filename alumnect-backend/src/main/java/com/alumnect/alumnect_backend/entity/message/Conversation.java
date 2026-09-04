package com.alumnect.alumnect_backend.entity.message;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng conversations — đại diện cho một cuộc hội thoại trực tiếp.
 */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@ToString(exclude = "participants")
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Thời điểm khởi tạo cuộc hội thoại */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm phát sinh tin nhắn mới nhất trong cuộc trò chuyện */
    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    /** Khóa định danh duy nhất cho cuộc hội thoại 1-1 (dạng min_max) chống trùng lặp */
    @Column(name = "direct_key", length = 100, unique = true)
    private String directKey;

    /** Danh sách thành viên tham gia cuộc hội thoại */
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ConversationParticipant> participants = new ArrayList<>();
}
