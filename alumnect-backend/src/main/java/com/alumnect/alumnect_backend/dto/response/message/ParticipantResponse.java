package com.alumnect.alumnect_backend.dto.response.message;

import com.alumnect.alumnect_backend.common.enums.ParticipantRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * DTO phản hồi thông tin chi tiết một thành viên trong cuộc hội thoại / nhóm chat.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {

    /** Mã người dùng */
    private Long userId;

    /** Họ tên người dùng */
    private String fullName;

    /** Ảnh đại diện */
    private String avatar;

    /** Chuyên ngành đào tạo */
    private String major;

    /** Vai trò trong cuộc hội thoại: ADMIN hoặc MEMBER */
    private ParticipantRole role;

    /** Thời điểm tham gia */
    private Instant joinedAt;
}
