package com.alumnect.alumnect_backend.entity.message;

import com.alumnect.alumnect_backend.common.enums.ParticipantRole;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Entity ánh xạ bảng conversation_participants — lưu thông tin thành viên tham gia hội thoại
 * cùng vai trò, trạng thái chấp nhận (người lạ / tin nhắn chờ), trạng thái đọc và lưu trữ.
 */
@Entity
@Table(name = "conversation_participants", uniqueConstraints = {
    @UniqueConstraint(name = "uq_conversation_participants_conv_user", columnNames = {"conversation_id", "user_id"})
})
@Getter
@Setter
@ToString(exclude = {"conversation", "user", "lastReadMessage"})
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationParticipant {

    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cuộc hội thoại tham gia */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    /** Người dùng tham gia */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Vai trò của người dùng trong hội thoại: ADMIN hoặc MEMBER */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private ParticipantRole role = ParticipantRole.MEMBER;

    /** Trạng thái đã chấp nhận tin nhắn (false nếu là tin nhắn chờ từ người lạ) */
    @Column(name = "is_accepted", nullable = false)
    @Builder.Default
    private boolean isAccepted = true;

    /** Tin nhắn gần nhất mà người dùng này đã đọc */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_message_id")
    private Message lastReadMessage;

    /** Đánh dấu người dùng đã lưu trữ (archive) cuộc trò chuyện này hay chưa */
    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    /** Thời điểm tham gia cuộc hội thoại */
    @Column(name = "joined_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();
}
