package com.alumnect.alumnect_backend.mapper.post;

import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.job.JobPosting;
import com.alumnect.alumnect_backend.entity.event.Event;
import com.alumnect.alumnect_backend.dto.response.post.JobDTO;
import com.alumnect.alumnect_backend.dto.response.post.EventDTO;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp Mapper chuyển đổi dữ liệu bài viết bảng tin (UC15 - View community Feed).
 * Kết hợp dữ liệu từ 3 nguồn (Post, User, UserProfile của tác giả) thành một
 * {@link PostResponse} phẳng khớp với schema Zod phía Frontend.
 * <p>
 * Lưu ý kỹ thuật: không dùng MapStruct {@code @Mapper} ở đây vì việc ghép dữ liệu
 * từ nhiều nguồn (Post + User + UserProfile) và tính toán thời gian tương đối là
 * logic nghiệp vụ tùy biến, không phải mapping field-to-field mà MapStruct tự sinh
 * code được — nếu khai báo interface chỉ toàn default method, MapStruct sẽ không
 * sinh ra implementation class (không có gì để nó implement), khiến Spring thiếu bean.
 */
@Component
public class PostMapper {

    /**
     * Chuyển đổi một bài viết (kèm tác giả) sang PostResponse trả về cho Client.
     *
     * @param post          Entity bài viết (đã JOIN FETCH sẵn {@code user})
     * @param authorProfile Hồ sơ công khai của tác giả (họ tên, avatar, headline) — có thể null nếu hồ sơ chưa được tạo
     * @param liked         true nếu người xem hiện tại đã thích bài viết này (UC17 - Like a post)
     * @param saved         true nếu người xem hiện tại đã lưu bài viết này (UC20 - Save Post)
     * @param job           Thông tin tuyển dụng (có thể null)
     * @param event         Thông tin sự kiện (có thể null)
     * @return DTO phẳng khớp schema Zod {@code postSchema} phía Frontend
     */
    public PostResponse toResponse(Post post, UserProfile authorProfile, boolean liked, boolean saved, JobPosting job, Event event) {
        User author = post.getAuthor();

        // Tên hiển thị & avatar: lấy từ UserProfile nếu có, fallback về email khi hồ sơ chưa được tạo.
        String authorName = authorProfile != null && authorProfile.getFullName() != null
                ? authorProfile.getFullName()
                : author.getEmail();
        String avatarUrl = authorProfile != null ? authorProfile.getAvatarUrl() : null;

        // "role" hiển thị dưới tên: lấy từ headline của hồ sơ, mặc định chuỗi rỗng.
        // (Sau khi merge dev, UserProfile không còn currentPosition/currentCompany —
        //  chức danh/công ty nay thuộc bảng experiences; tránh truy cập LAZY gây N+1 ở feed.)
        String role = authorProfile != null && authorProfile.getHeadline() != null
                ? authorProfile.getHeadline()
                : "";

        return PostResponse.builder()
                .id(String.valueOf(post.getId()))
                .authorId(author != null && author.getId() != null ? String.valueOf(author.getId()) : null)
                .type(post.getCategory() == com.alumnect.alumnect_backend.common.enums.PostCategory.GENERAL ? "normal" : post.getCategory().name().toLowerCase())
                .author(authorName)
                .role(role)
                .avatar(avatarUrl != null ? avatarUrl : "")
                .verified(author.isAccountVerified())
                .time(toRelativeTime(post.getCreatedAt()))
                .text(post.getContent())
                .images(post.getMediaList() != null
                        ? post.getMediaList().stream()
                                .sorted(java.util.Comparator.comparingInt(com.alumnect.alumnect_backend.entity.post.PostMedia::getSortOrder))
                                .map(com.alumnect.alumnect_backend.entity.post.PostMedia::getUrl)
                                .collect(Collectors.toList())
                        : List.of())
                .likes(post.getLikeCount())
                .comments(post.getCommentCount())
                .reposts(post.getRepostCount())
                // UC17: cờ liked phản ánh người xem hiện tại đã thích bài này hay chưa.
                .liked(liked)
                // UC20: cờ saved phản ánh người xem hiện tại đã lưu bài này hay chưa.
                .saved(saved)
                .eventId(post.getEventId() != null ? String.valueOf(post.getEventId()) : null)
                .jobId(post.getJobId() != null ? String.valueOf(post.getJobId()) : null)
                .job(job != null ? JobDTO.builder()
                        .title(job.getTitle())
                        .company(job.getCompany())
                        .location(job.getLocation())
                        .salaryMin(job.getSalaryMin())
                        .salaryMax(job.getSalaryMax())
                        .applyUrl(job.getApplyUrl())
                        .contactEmail(job.getContactEmail())
                        .build() : null)
                .event(event != null ? EventDTO.builder()
                        .title(event.getTitle())
                        .location(event.getLocation())
                        .startTime(event.getStartTime())
                        .endTime(event.getEndTime())
                        .capacity(event.getCapacity())
                        .build() : null)
                .build();
    }

    /**
     * Phương thức tương thích ngược (overload) không truyền cờ saved (mặc định false).
     */
    public PostResponse toResponse(Post post, UserProfile authorProfile, boolean liked, JobPosting job, Event event) {
        return toResponse(post, authorProfile, liked, false, job, event);
    }

    /**
     * Quy đổi thời điểm tạo bài viết sang chuỗi thời gian tương đối ngắn gọn
     * (VD: "5m", "3h", "2d") để hiển thị trực tiếp trên Frontend, khớp định dạng
     * mock data cũ mà Frontend đang mong đợi ở trường {@code time}.
     *
     * @param createdAt Thời điểm tạo bài viết
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
