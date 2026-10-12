package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi thông tin của một phiên bản Snapshot trong Mentoring Deal (UC104).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringDealSnapshotResponse {

    /** ID định danh của snapshot */
    private Long id;

    /** ID của thỏa thuận Deal */
    private Long dealId;

    /** Số thứ tự phiên bản snapshot */
    private Integer version;

    /** Phạm vi công việc tại snapshot này */
    private String taskScope;

    /** Mức giá thỏa thuận tại snapshot này (VND) */
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành tại snapshot này */
    private Instant deadline;

    /** Hình thức làm việc: ONLINE, OFFLINE, BOTH */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia: INDIVIDUAL, GROUP */
    private MentoringParticipationType participationType;

    /** Loại nhiệm vụ: CONSULTATION, PROJECT_MENTORING... */
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra tại snapshot này */
    private String expectedResult;

    /** ID người đã điều chỉnh / đề xuất snapshot này */
    private Long modifiedByUserId;

    /** Họ tên người đã điều chỉnh / đề xuất snapshot này */
    private String modifiedByName;

    /** Ảnh đại diện người điều chỉnh */
    private String modifiedByAvatar;

    /** Ghi chú lý do thay đổi / đề xuất */
    private String changeNote;

    /** Thời điểm tạo snapshot này */
    private Instant createdAt;
}
