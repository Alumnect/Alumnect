package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Payload gửi Settlement Ticket đã thỏa thuận lên Admin (UC111).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitSettlementTicketRequest {

    /** ID của đề xuất phân chia tiền dừng Task (Settlement Proposal) đã được hai bên đồng thuận */
    @NotNull(message = "ID của thỏa thuận phân chia tiền không được để trống")
    private Long proposalId;

    /** Ghi chú giải trình thêm gửi tới Ban Quản Trị (Tùy chọn) */
    @Size(max = 1000, message = "Ghi chú không vượt quá 1000 ký tự")
    private String note;
}
