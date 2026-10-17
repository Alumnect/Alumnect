package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.enums.ProposalSource;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO yêu cầu Mentor phát hành một phiên bản Deal Ticket mới trong Chat for Task (UC104).
 * Client chỉ gửi định danh Chat for Task; Request, Student và Mentor được server suy ra từ cuộc hội thoại.
 * - REQUEST_ACCEPTANCE: điều khoản được hệ thống lấy từ chính Request (các trường điều khoản bị bỏ qua).
 * - RENEGOTIATION: Mentor nhập toàn bộ điều khoản mới.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposeDealRequest {

    /** ID Chat for Task (Conversation MENTORING) mà Deal Ticket thuộc về */
    @NotNull(message = "ID cuộc trò chuyện (conversationId) không được để trống.")
    private Long conversationId;

    /** Cách tạo Deal Ticket: REQUEST_ACCEPTANCE (chấp nhận theo Request) hoặc RENEGOTIATION (deal lại) */
    @NotNull(message = "Cách tạo Deal Ticket (proposalSource) không được để trống.")
    private ProposalSource proposalSource;

    /** Phạm vi công việc (bắt buộc khi RENEGOTIATION) */
    @Size(min = 10, max = 5000, message = "Phạm vi công việc phải từ 10 đến 5000 ký tự.")
    private String taskScope;

    /** Giá thỏa thuận VND (bắt buộc khi RENEGOTIATION) */
    @DecimalMin(value = "0.0", inclusive = true, message = "Mức giá thỏa thuận phải lớn hơn hoặc bằng 0 VND.")
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành (bắt buộc khi RENEGOTIATION) */
    @Future(message = "Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.")
    private Instant deadline;

    /** Hình thức làm việc (bắt buộc khi RENEGOTIATION) */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia (bắt buộc khi RENEGOTIATION) */
    private MentoringParticipationType participationType;

    /** Loại nhiệm vụ (bắt buộc khi RENEGOTIATION) */
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra (bắt buộc khi RENEGOTIATION) */
    @Size(min = 10, max = 3000, message = "Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.")
    private String expectedResult;

    /** Ghi chú của phiên bản (tùy chọn) */
    @Size(max = 255, message = "Ghi chú đề xuất không được vượt quá 255 ký tự.")
    private String changeNote;
}
