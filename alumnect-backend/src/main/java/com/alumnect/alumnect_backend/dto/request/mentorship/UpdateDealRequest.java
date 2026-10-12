package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO yêu cầu điều chỉnh các điều khoản của Mentoring Deal hiện có (UC104).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDealRequest {

    /** Phạm vi công việc / nội dung chi tiết điều chỉnh */
    @NotBlank(message = "Phạm vi công việc (Task Scope) không được để trống.")
    @Size(min = 10, max = 5000, message = "Phạm vi công việc phải từ 10 đến 5000 ký tự.")
    private String taskScope;

    /** Mức giá thỏa thuận điều chỉnh (VND) */
    @NotNull(message = "Mức giá thỏa thuận không được để trống.")
    @DecimalMin(value = "0.0", inclusive = true, message = "Mức giá thỏa thuận phải lớn hơn hoặc bằng 0 VND.")
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành điều chỉnh */
    @NotNull(message = "Hạn chót hoàn thành (Deadline) không được để trống.")
    @Future(message = "Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.")
    private Instant deadline;

    /** Hình thức làm việc điều chỉnh: ONLINE, OFFLINE, BOTH */
    @NotNull(message = "Hình thức làm việc (Working Mode) không được để trống.")
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia điều chỉnh: INDIVIDUAL hoặc GROUP */
    @NotNull(message = "Hình thức tham gia (Participation Type) không được để trống.")
    private MentoringParticipationType participationType;

    /** Loại nhiệm vụ điều chỉnh: CONSULTATION, PROJECT_MENTORING... */
    @NotNull(message = "Loại nhiệm vụ (Task Type) không được để trống.")
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra điều chỉnh */
    @NotBlank(message = "Kết quả kỳ vọng đầu ra (Expected Result) không được để trống.")
    @Size(min = 10, max = 3000, message = "Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.")
    private String expectedResult;

    /** Ghi chú lý do thay đổi điều khoản */
    @Size(max = 255, message = "Ghi chú thay đổi không được vượt quá 255 ký tự.")
    private String changeNote;
}
