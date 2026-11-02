package com.alumnect.alumnect_backend.dto.response.group;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Thông tin chi tiết một bài viết / thảo luận trong hội nhóm trả về cho client.
 * Bỏ key "pinned" do getter Lombok `isPinned()` tự sinh để JSON chỉ còn đúng một key "isPinned" như frontend mong đợi.
 */
@JsonIgnoreProperties("pinned")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupPostResponse {

    private Long id;
    private Long groupId;
    private GroupPostAuthorResponse author;
    private String content;
    private String topic;
    private List<String> imageUrls;
    private List<String> videoUrls;
    /** Bài viết đang được ghim lên đầu hội nhóm (serialize đúng tên "isPinned") */
    @JsonProperty("isPinned")
    private boolean isPinned;
    private int likeCount;
    private int commentCount;

    /** Người xem hiện tại đã thích bài viết này hay chưa */
    private boolean likedByViewer;

    /** Người xem có quyền ghim/bỏ ghim (Owner / Admin nhóm) */
    private boolean canPin;

    /** Người xem có quyền sửa bài viết (chính tác giả) */
    private boolean canEdit;

    /** Người xem có quyền xóa bài viết (tác giả hoặc Owner / Admin nhóm) */
    private boolean canDelete;

    private Instant createdAt;
    private Instant updatedAt;
}
