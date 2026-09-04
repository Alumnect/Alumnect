package com.alumnect.alumnect_backend.entity.message;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng messages — lưu thông tin từng tin nhắn trong cuộc hội thoại.
 */
@Entity
@Table(name = "messages")
@Getter
@Setter
@ToString(exclude = {"conversation", "sender", "attachments"})
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cuộc hội thoại chứa tin nhắn này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    /** Người dùng gửi tin nhắn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /** Nội dung văn bản của tin nhắn (có thể null nếu chỉ gửi tệp đính kèm) */
    @Column(columnDefinition = "TEXT")
    private String content;

    /** Cờ đánh dấu tin nhắn đã bị xóa/thu hồi */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    /** Thời điểm gửi tin nhắn */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Danh sách tệp đính kèm (ảnh, video, file) của tin nhắn */
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MessageAttachment> attachments = new ArrayList<>();
}
