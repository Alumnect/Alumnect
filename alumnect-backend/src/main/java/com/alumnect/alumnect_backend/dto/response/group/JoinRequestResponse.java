package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Một yêu cầu tham gia hội nhóm riêng tư đang chờ Owner/Admin xử lý. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequestResponse {
    /** Mã yêu cầu (chính là id dòng group_members) */
    private Long requestId;
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private String headline;
    private String status;
    private Instant requestedAt;
}
