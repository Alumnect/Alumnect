package com.alumnect.alumnect_backend.entity.message;

import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng conversations — đại diện cho cuộc hội thoại trực tiếp 1-1 hoặc nhóm chat.
 */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@ToString(exclude = {"participants", "createdBy"})
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Loại cuộc hội thoại: DIRECT hoặc GROUP */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    @Builder.Default
    private ConversationType type = ConversationType.DIRECT;

    /** Tiêu đề / Tên cuộc hội thoại (đặc biệt đối với GROUP chat) */
    @Column(name = "title")
    private String title;

    /** Ảnh đại diện nhóm chat */
    @Column(name = "avatar_url")
    private String avatarUrl;

    /** Người tạo nhóm chat (nếu có) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

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
