package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO phản hồi chi tiết toàn diện của Mentoring Deal bao gồm Deal hiện tại,
 * Snapshot mới nhất và toàn bộ lịch sử các phiên bản Snapshot (UC104).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringDealDetailResponse {

    /** Thông tin trạng thái và điều khoản hiện tại của Deal */
    private MentoringDealResponse deal;

    /** Snapshot điều khoản mới nhất của thỏa thuận */
    private MentoringDealSnapshotResponse latestSnapshot;

    /** Danh sách toàn bộ lịch sử các phiên bản Snapshot từ version 1 đến hiện tại */
    @Builder.Default
    private List<MentoringDealSnapshotResponse> snapshots = new ArrayList<>();
}
