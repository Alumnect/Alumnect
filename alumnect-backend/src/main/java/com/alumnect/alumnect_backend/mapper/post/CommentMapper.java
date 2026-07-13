package com.alumnect.alumnect_backend.mapper.post;

import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;

/**
 * Lớp Mapper chuyển đổi dữ liệu bình luận (UC16 - View Post Detail).
 * Kết hợp dữ liệu từ 3 nguồn (Comment, User, UserProfile của tác giả) thành một
 * {@link CommentResponse} phẳng khớp với schema Zod phía Frontend.
 * <p>
 * Lưu ý kỹ thuật: không dùng MapStruct {@code @Mapper} ở đây (giống {@link PostMapper})
 * vì việc ghép dữ liệu từ nhiều nguồn (Comment + User + UserProfile) và tính toán thời
 * gian tương đối là logic nghiệp vụ tùy biến, không phải mapping field-to-field mà
 * MapStruct tự sinh code được.
 */
@Component
public class CommentMapper {

    /**
     * Chuyển đổi một bình luận (kèm tác giả) sang CommentResponse trả về cho Client.
     *
     * @param comment       Entity bình luận (đã JOIN FETCH sẵn {@code user})
     * @param authorProfile Hồ sơ công khai của tác giả (họ tên, avatar, headline) — có thể null nếu hồ sơ chưa được tạo
     * @return DTO phẳng khớp schema Zod {@code commentSchema} phía Frontend
     */
    public CommentResponse toResponse(Comment comment, UserProfile authorProfile) {
        User author = comment.getUser();

        // Tên hiển thị & avatar: lấy từ UserProfile nếu có, fallback về email khi hồ sơ chưa được tạo.
        String authorName = authorProfile != null && authorProfile.getFullName() != null
                ? authorProfile.getFullName()
                : author.getEmail();
        String avatarUrl = authorProfile != null ? authorProfile.getAvatarUrl() : null;

        // "role" hiển thị dưới tên: ưu tiên headline, fallback ghép "chức danh @ công ty", cuối cùng là chuỗi rỗng.
        String role = "";
        if (authorProfile != null) {
            if (authorProfile.getHeadline() != null && !authorProfile.getHeadline().isBlank()) {
                role = authorProfile.getHeadline();
            } else if (authorProfile.getCurrentPosition() != null && !authorProfile.getCurrentPosition().isBlank()) {
                role = authorProfile.getCurrentCompany() != null && !authorProfile.getCurrentCompany().isBlank()
                        ? authorProfile.getCurrentPosition() + " @ " + authorProfile.getCurrentCompany()
                        : authorProfile.getCurrentPosition();
            }
        }

        return CommentResponse.builder()
                .id(String.valueOf(comment.getId()))
                .author(authorName)
                .role(role)
                .avatar(avatarUrl != null ? avatarUrl : "")
                .verified(author.isAccountVerified())
                .time(toRelativeTime(comment.getCreatedAt()))
                .text(comment.getContent())
                // Truy cập id của comment cha không kích hoạt tải LAZY (id đã có trong khóa ngoại).
                .parentId(comment.getParentComment() != null
                        ? String.valueOf(comment.getParentComment().getId())
                        : null)
                .build();
    }

    /**
     * Quy đổi thời điểm tạo bình luận sang chuỗi thời gian tương đối ngắn gọn
     * (VD: "5m", "3h", "2d") để hiển thị trực tiếp trên Frontend.
     *
     * @param createdAt Thời điểm tạo bình luận
     * @return Chuỗi thời gian tương đối, hoặc "vừa xong" nếu chưa đầy 1 phút
     */
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
