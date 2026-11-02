package com.alumnect.alumnect_backend.mapper.forum;

import com.alumnect.alumnect_backend.dto.response.forum.AnswerResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Lớp Mapper chuyển đổi dữ liệu câu trả lời diễn đàn (UC41 - Answer a question).
 * Ghép dữ liệu từ nhiều nguồn (Answer + tác giả User/UserProfile) thành một {@link AnswerResponse}
 * phẳng khớp schema Zod phía Frontend.
 */
@Component
public class AnswerMapper {

    /**
     * Chuyển đổi một câu trả lời (kèm tác giả) sang AnswerResponse trả về cho Client.
     *
     * @param answer        Entity câu trả lời (đã JOIN FETCH sẵn {@code author})
     * @param authorProfile Hồ sơ công khai của tác giả (họ tên, avatar, headline) — có thể null nếu chưa tạo hồ sơ
     * @param replies       Danh sách reply của câu trả lời này (rỗng nếu không có / bản thân là reply)
     * @param voted         true nếu người xem hiện tại đã bình chọn câu trả lời này (UC43), false với Guest
     * @return DTO phẳng khớp schema Zod {@code answerSchema} phía Frontend
     */
    public AnswerResponse toResponse(Answer answer, UserProfile authorProfile, List<AnswerResponse> replies, boolean voted) {
        User author = answer.getAuthor();

        // Tên hiển thị, avatar & headline: lấy từ UserProfile nếu có, fallback hợp lý khi hồ sơ chưa được tạo.
        String authorName = authorProfile != null && authorProfile.getFullName() != null
                ? authorProfile.getFullName()
                : author.getEmail();
        String avatarUrl = authorProfile != null && authorProfile.getAvatarUrl() != null
                ? authorProfile.getAvatarUrl()
                : "";
        String headline = authorProfile != null && authorProfile.getHeadline() != null
                ? authorProfile.getHeadline()
                : "";

        return AnswerResponse.builder()
                .id(String.valueOf(answer.getId()))
                .parentId(answer.getParent() != null ? String.valueOf(answer.getParent().getId()) : null)
                .authorId(String.valueOf(author.getId()))
                .body(answer.getBody())
                .author(authorName)
                .avatar(avatarUrl)
                .authorHeadline(headline)
                .verified(author.isAccountVerified())
                .votes(answer.getVoteCount())
                .voted(voted)
                .time(toRelativeTime(answer.getCreatedAt()))
                .createdAt(answer.getCreatedAt() != null ? answer.getCreatedAt().toString() : "")
                .edited(isEdited(answer))
                .replies(replies != null ? replies : List.of())
                .build();
    }

    /**
     * Quy đổi thời điểm tạo câu trả lời sang chuỗi thời gian tương đối ngắn gọn (VD: "5m", "3h", "2d").
     *
     * @param createdAt Thời điểm tạo câu trả lời
     * @return Chuỗi thời gian tương đối, hoặc "vừa xong" nếu chưa đầy 1 phút
     */
    /**
     * Xác định câu trả lời đã từng được chỉnh sửa hay chưa: updated_at trễ hơn created_at
     * quá 2 giây (bỏ qua chênh lệch nhỏ lúc tạo do @PrePersist gán hai mốc gần như trùng nhau).
     *
     * @param answer Entity câu trả lời
     * @return true nếu đã chỉnh sửa
     */
    private boolean isEdited(Answer answer) {
        if (answer.getCreatedAt() == null || answer.getUpdatedAt() == null) {
            return false;
        }
        return answer.getUpdatedAt().isAfter(answer.getCreatedAt().plusSeconds(2));
    }

    private String toRelativeTime(Instant createdAt) {
        Duration diff = Duration.between(createdAt, Instant.now());
        long minutes = diff.toMinutes();
        if (minutes < 1) return "vừa xong";
        if (minutes < 60) return minutes + "m";
        long hours = diff.toHours();
        if (hours < 24) return hours + "h";
        long days = diff.toDays();
        return days + "d";
    }
}
