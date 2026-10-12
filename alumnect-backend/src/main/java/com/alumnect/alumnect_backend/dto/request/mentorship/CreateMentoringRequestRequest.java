package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO nhận dữ liệu gửi lên khi sinh viên tạo yêu cầu Mentoring (UC100, UC101).
 * Nếu mentorId được cung cấp -> Yêu cầu gửi trực tiếp tới Mentor cụ thể (UC101).
 * Nếu mentorId là null -> Yêu cầu mở chung, matching tự động (UC100).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMentoringRequestRequest {

    /** Định danh của Mentor nhận yêu cầu (chỉ dùng cho yêu cầu trực tiếp UC101, null nếu UC100) */
    private Long mentorId;

    /** Tiêu đề ngắn gọn mô tả nhu cầu cố vấn */
    @NotBlank(message = "Tiêu đề yêu cầu không được để trống")
    @Size(min = 5, max = 200, message = "Tiêu đề yêu cầu phải từ 5 đến 200 ký tự")
    private String title;

    /** Mô tả chi tiết nhu cầu hỗ trợ, vấn đề gặp phải và kỳ vọng đối với Mentor */
    @NotBlank(message = "Mô tả chi tiết không được để trống")
    @Size(min = 20, max = 3000, message = "Mô tả chi tiết phải từ 20 đến 3000 ký tự")
    private String description;

    /** ID của lĩnh vực / ngành nghề cần hỗ trợ (tham chiếu bảng industries) */
    @NotNull(message = "Lĩnh vực cần hỗ trợ không được để trống")
    private Long industryId;

    /** Ngân sách tối thiểu dự kiến (VNĐ) */
    @PositiveOrZero(message = "Ngân sách tối thiểu không được âm")
    private BigDecimal budgetMin;

    /** Ngân sách tối đa sẵn sàng chi trả (VNĐ) */
    @PositiveOrZero(message = "Ngân sách tối đa không được âm")
    private BigDecimal budgetMax;

    /** Phương thức làm việc mong muốn: ONLINE, OFFLINE, BOTH */
    @NotNull(message = "Hình thức làm việc không được để trống")
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia mong muốn: INDIVIDUAL (1-1), GROUP (nhóm), hoặc BOTH */
    @NotNull(message = "Hình thức tham gia không được để trống")
    private MentoringType participationType;

    /** Loại nhiệm vụ hỗ trợ: CAREER_ORIENTATION, RESUME_REVIEW, MOCK_INTERVIEW... */
    @NotNull(message = "Loại nhiệm vụ không được để trống")
    private MentoringTaskType taskType;

    /** Thời hạn mong muốn hoàn thành buổi/chương trình cố vấn */
    @Future(message = "Thời hạn mong muốn phải ở trong tương lai")
    private Instant expectedDeadline;

    /** Danh sách tài liệu đính kèm (tối đa 5 tệp, mỗi tệp nhỏ hơn 10 MB) */
    @Size(max = 5, message = "Chỉ được đính kèm tối đa 5 tệp tin")
    @Valid
    private List<MentoringAttachmentRequest> attachments;
}
