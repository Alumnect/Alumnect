package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO yêu cầu Mentor cập nhật nhật ký công việc khi chưa được học viên xác nhận (UC107).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMentoringWorkLogRequest {

    /** Ngày ghi nhận công việc */
    @NotNull(message = "Ngày ghi nhận công việc không được để trống.")
    private LocalDate logDate;

    /** Tóm tắt mô tả công việc */
    @NotBlank(message = "Mô tả công việc không được để trống.")
    @Size(min = 5, max = 5000, message = "Mô tả công việc phải từ 5 đến 5000 ký tự.")
    private String description;

    /** Chi tiết các hạng mục công việc đã hoàn thành */
    @NotBlank(message = "Nội dung công việc hoàn thành không được để trống.")
    @Size(min = 5, max = 5000, message = "Nội dung công việc hoàn thành phải từ 5 đến 5000 ký tự.")
    private String workCompleted;

    /** Kết quả và sản phẩm đạt được */
    @NotBlank(message = "Kết quả đạt được không được để trống.")
    @Size(min = 5, max = 5000, message = "Kết quả đạt được phải từ 5 đến 5000 ký tự.")
    private String result;

    /** Kế hoạch và hành động tiếp theo */
    @Size(max = 2000, message = "Hành động tiếp theo không vượt quá 2000 ký tự.")
    private String nextAction;

    /** Danh sách tài liệu minh chứng cập nhật */
    @Valid
    @Builder.Default
    private List<WorkLogAttachmentRequest> attachments = new ArrayList<>();
}
