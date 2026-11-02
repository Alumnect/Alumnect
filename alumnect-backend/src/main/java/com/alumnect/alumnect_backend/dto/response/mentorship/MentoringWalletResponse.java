package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/** Tổng hợp tiền chi ra cho người dùng: thù lao (Mentor) hoặc hoàn tiền (Học viên). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringWalletResponse {
    /** Đã chuyển thành công */
    private BigDecimal totalReceived;
    /** Đang chờ chuyển (kể cả chờ tài khoản nhận tiền) */
    private BigDecimal totalProcessing;
    /** Chuyển chưa thành công, chờ Ban Quản Trị xử lý */
    private BigDecimal totalFailed;
    /** Đang chờ người dùng cập nhật tài khoản ngân hàng */
    private boolean bankAccountRequired;
    private List<MentoringWalletItemResponse> items;
}
