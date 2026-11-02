package com.alumnect.alumnect_backend.dto.response.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO đại diện cho một mục trong lịch sử tham gia sự kiện của người dùng (UC28 - View attended-event history).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventHistoryResponse {

    /** ID bản ghi đăng ký tham gia (event_registrations.id) */
    private Long registrationId;

    /** Trạng thái đăng ký: REGISTERED hoặc CANCELLED */
    private String registrationStatus;

    /** Thời điểm người dùng thực hiện đăng ký */
    private Instant registeredAt;

    /** ID của sự kiện */
    private Long eventId;

    /** Tiêu đề sự kiện */
    private String title;

    /** Địa điểm tổ chức sự kiện */
    private String location;

    /** Thời gian bắt đầu sự kiện */
    private Instant startTime;

    /** Thời gian kết thúc sự kiện */
    private Instant endTime;

    /** Sức chứa tối đa của sự kiện */
    private Integer capacity;

    /** Số người hiện tại đang tham gia sự kiện */
    private Integer attendeeCount;

    /** Trạng thái của sự kiện: ACTIVE hoặc CANCELLED */
    private String eventStatus;

    /** ID bài viết liên kết với sự kiện (nếu có) để dẫn link tới bài viết chi tiết */
    private Long postId;

    /** Ảnh bìa của sự kiện (lấy từ bài viết nếu có) */
    private String coverUrl;

    /** ID người tổ chức sự kiện */
    private Long organizerId;

    /** Tên người tổ chức sự kiện */
    private String organizerName;

    /** Avatar người tổ chức sự kiện */
    private String organizerAvatar;

    /**
     * Trạng thái tính toán phục vụ hiển thị trực quan:
     * - UPCOMING: Sự kiện sắp diễn ra và người dùng đang đăng ký hợp lệ
     * - ONGOING: Sự kiện đang diễn ra
     * - PAST: Sự kiện đã kết thúc và người dùng đã tham gia
     * - REGISTRATION_CANCELLED: Người dùng đã hủy đăng ký
     * - EVENT_CANCELLED: Ban tổ chức đã hủy sự kiện
     */
    private String attendanceState;
}
