package com.alumnect.alumnect_backend.mapper.forum;

import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;

/**
 * Lớp Mapper chuyển đổi dữ liệu câu hỏi diễn đàn (UC38 - View question list).
 * Kết hợp dữ liệu từ nhiều nguồn (Question + tác giả User/UserProfile + ForumTopic) thành một
 * {@link QuestionResponse} phẳng khớp schema Zod phía Frontend.
 * <p>
 * Không dùng MapStruct vì việc ghép dữ liệu đa nguồn, cắt trích đoạn nội dung và tính thời gian
 * tương đối là logic tùy biến, không phải mapping field-to-field mà MapStruct tự sinh được.
 */
@Component
public class QuestionMapper {

    /** Độ dài tối đa của đoạn trích nội dung câu hỏi hiển thị trên danh sách. */
    private static final int EXCERPT_MAX_LENGTH = 160;

    /**
     * Chuyển đổi một câu hỏi (kèm tác giả và chủ đề) sang QuestionResponse trả về cho Client.
     *
     * @param question      Entity câu hỏi (đã JOIN FETCH sẵn {@code author} và {@code topic})
     * @param authorProfile Hồ sơ công khai của tác giả (họ tên, avatar) — có thể null nếu chưa tạo hồ sơ
     * @return DTO phẳng khớp schema Zod {@code questionSchema} phía Frontend
     */
    public QuestionResponse toResponse(Question question, UserProfile authorProfile) {
        User author = question.getAuthor();

        // Tên hiển thị & avatar: lấy từ UserProfile nếu có, fallback về email khi hồ sơ chưa được tạo.
        String authorName = authorProfile != null && authorProfile.getFullName() != null
                ? authorProfile.getFullName()
                : author.getEmail();
        String avatarUrl = authorProfile != null && authorProfile.getAvatarUrl() != null
                ? authorProfile.getAvatarUrl()
                : "";

        // Tên chủ đề: chuỗi rỗng nếu câu hỏi chưa được phân loại.
        ForumTopic topic = question.getTopic();
        String topicName = topic != null ? topic.getName() : "";

        return QuestionResponse.builder()
                .id(String.valueOf(question.getId()))
                .title(question.getTitle())
                .excerpt(buildExcerpt(question.getBody()))
                .topic(topicName)
                .author(authorName)
                .avatar(avatarUrl)
                .verified(author.isAccountVerified())
                .votes(question.getVoteCount())
                .answers(question.getAnswerCount())
                .time(toRelativeTime(question.getCreatedAt()))
                .build();
    }

    /**
     * Chuyển đổi một câu hỏi (kèm tác giả và chủ đề) sang QuestionDetailResponse cho màn hình chi tiết
     * (UC39 - View question detail). Khác {@link #toResponse}: giữ nguyên toàn bộ nội dung {@code body},
     * bổ sung dòng tiêu đề tác giả (headline), ID chủ đề và mốc thời gian tuyệt đối.
     *
     * @param question      Entity câu hỏi (đã JOIN FETCH sẵn {@code author} và {@code topic})
     * @param authorProfile Hồ sơ công khai của tác giả (họ tên, avatar, headline) — có thể null nếu chưa tạo hồ sơ
     * @return DTO chi tiết phẳng khớp schema Zod {@code questionDetailSchema} phía Frontend
     */
    public QuestionDetailResponse toDetailResponse(Question question, UserProfile authorProfile) {
        User author = question.getAuthor();

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

        // Tên & ID chủ đề: rỗng/null nếu câu hỏi chưa được phân loại.
        ForumTopic topic = question.getTopic();
        String topicName = topic != null ? topic.getName() : "";
        Long topicId = topic != null ? topic.getId() : null;

        return QuestionDetailResponse.builder()
                .id(String.valueOf(question.getId()))
                .title(question.getTitle())
                .body(question.getBody())
                .topic(topicName)
                .topicId(topicId)
                .author(authorName)
                .avatar(avatarUrl)
                .authorHeadline(headline)
                .verified(author.isAccountVerified())
                .votes(question.getVoteCount())
                .answers(question.getAnswerCount())
                .time(toRelativeTime(question.getCreatedAt()))
                .createdAt(question.getCreatedAt() != null ? question.getCreatedAt().toString() : "")
                .build();
    }

    /**
     * Chuyển đổi một chủ đề diễn đàn sang TopicResponse cho bộ lọc phía Frontend.
     *
     * @param topic Entity chủ đề
     * @return DTO chủ đề gồm id và tên
     */
    public TopicResponse toTopicResponse(ForumTopic topic) {
        return TopicResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .parentId(topic.getParentId())
                .build();
    }

    /**
     * Cắt trích một đoạn ngắn từ nội dung câu hỏi để xem trước trên danh sách.
     * Rút gọn khoảng trắng thừa và thêm dấu "…" nếu nội dung vượt quá độ dài tối đa.
     *
     * @param body Nội dung đầy đủ của câu hỏi
     * @return Đoạn trích tối đa {@value #EXCERPT_MAX_LENGTH} ký tự
     */
    private String buildExcerpt(String body) {
        if (body == null) {
            return "";
        }
        String normalized = body.strip().replaceAll("\\s+", " ");
        if (normalized.length() <= EXCERPT_MAX_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, EXCERPT_MAX_LENGTH).stripTrailing() + "…";
    }

    /**
     * Quy đổi thời điểm tạo câu hỏi sang chuỗi thời gian tương đối ngắn gọn (VD: "5m", "3h", "2d")
     * để hiển thị trực tiếp trên Frontend.
     *
     * @param createdAt Thời điểm tạo câu hỏi
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
