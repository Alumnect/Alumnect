package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO tổng hợp số liệu phản hồi từ các Mentor đối với yêu cầu Mentoring (UC102).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringResponseSummaryResponse {

    /** Tổng số lượng Mentor thực tế đã nhận được phân phối yêu cầu này */
    @Builder.Default
    private int totalDistributed = 0;

    /** Số lượng Mentor đang chờ phản hồi (WAITING / PENDING) */
    @Builder.Default
    private int waitingCount = 0;

    /** Số lượng Mentor đã chấp nhận trao đổi (ACCEPTED) */
    @Builder.Default
    private int acceptedCount = 0;

    /** Số lượng Mentor đã từ chối yêu cầu (DECLINED / REJECTED) */
    @Builder.Default
    private int declinedCount = 0;

    /** Số lượng phân phối đã quá hạn (EXPIRED) */
    @Builder.Default
    private int expiredCount = 0;
}
