package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO tóm tắt thông tin Mentoring Deal đã chốt gắn liền với Task (UC106).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringDealSummaryResponse {

    /** ID thỏa thuận Deal */
    private Long id;

    /** Mức chi phí thỏa thuận (VND) */
    private BigDecimal agreedPrice;

    /** Phạm vi công việc đã thỏa thuận */
    private String taskScope;

    /** Thời hạn hoàn thành theo Deal */
    private Instant deadline;

    /** Hình thức làm việc: ONLINE, OFFLINE, BOTH */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia: INDIVIDUAL, GROUP */
    private MentoringParticipationType participationType;

    /** Phân loại công việc */
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra */
    private String expectedResult;

    /** Phiên bản Deal đã chốt */
    private Integer version;

    /** Trạng thái đã thanh toán */
    private Boolean isPaid;

    /** Thời điểm hoàn tất thanh toán */
    private Instant paidAt;
}
