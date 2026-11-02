package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Thông tin một hội nhóm hiển thị trên thẻ (Group Card) ở danh sách. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupCardResponse {
    private Long id;
    private String name;
    /** Mô tả rút gọn (cắt ở danh sách) */
    private String shortDescription;
    private String coverImageUrl;
    private String category;
    private List<String> topics;
    private String privacy;
    private int memberCount;
    private String status;
    /** NONE | ACTIVE | PENDING | REJECTED | LEFT | REMOVED */
    private String viewerMembershipStatus;
    /** OWNER | ADMIN | MEMBER, null nếu người xem không phải thành viên ACTIVE */
    private String viewerRole;
}
