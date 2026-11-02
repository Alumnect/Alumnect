package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

/**
 * Payload yêu cầu mở Dispute Ticket khi hai bên không thể tự thống nhất (UC112).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDisputeTicketRequest {

    /** Tiêu đề ngắn gọn của khiếu nại */
    @NotBlank(message = "Tiêu đề khiếu nại không được để trống")
    @Size(max = 255, message = "Tiêu đề không vượt quá 255 ký tự")
    private String title;

    /** Lý do tranh chấp (ví dụ: Không hoàn thành công việc, Không phản hồi, Bất đồng phân chia tiền...) */
    @NotBlank(message = "Lý do khiếu nại không được để trống")
    @Size(max = 255, message = "Lý do khiếu nại không vượt quá 255 ký tự")
    private String disputeReason;

    /** Mô tả chi tiết vấn đề phát sinh */
    @NotBlank(message = "Nội dung mô tả khiếu nại không được để trống")
    @Size(min = 10, max = 3000, message = "Nội dung mô tả từ 10 đến 3000 ký tự")
    private String description;

    /** Phương án mong muốn giải quyết (ví dụ: Hoàn tiền 100%, Hoàn tiền 50%, Yêu cầu hoàn thành deliverables...) */
    @NotBlank(message = "Phương án mong muốn không được để trống")
    @Size(max = 255, message = "Phương án mong muốn không vượt quá 255 ký tự")
    private String desiredSolution;

    /** Danh sách bằng chứng ban đầu (tùy chọn) */
    @Valid
    private List<TicketEvidenceRequest> initialEvidences;
}
