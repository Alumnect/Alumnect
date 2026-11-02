package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thông tin tác giả bài viết / bình luận trong hội nhóm kèm vai trò trong nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupPostAuthorResponse {

    private Long userId;
    private String fullName;
    private String avatarUrl;

    /** Vai trò trong hội nhóm: OWNER, ADMIN, MEMBER, hoặc null nếu không còn trong nhóm */
    private String groupRole;

    /** Nhãn hiển thị vai trò: Sáng lập, Quản trị viên, Thành viên */
    private String roleLabel;
}
