package com.alumnect.alumnect_backend.dto.response.salary;

import com.alumnect.alumnect_backend.common.enums.SalaryAnomalyStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO kết quả AI kiểm tra lương [A1] trước khi đóng góp: % bất thường, quyết định chặn/cho phép, mặt bằng thị trường
 * thực tế, thống kê nội bộ AlumNect và gợi ý sửa nhanh. Mọi số tiền tính theo VNĐ/tháng (Gross).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryAiCheckResponse {

    /** % lệch so với TRẦN thị trường (0 nếu không vượt trần). Ví dụ 680 = cao hơn trần 680%. */
    private int anomalyPercentage;

    /** true = CHẶN CỨNG, không cho đóng góp bản ghi này. */
    @JsonProperty("isBlocked")
    private boolean isBlocked;

    /** true = cho phép nhưng người dùng phải bấm "Xác nhận gửi" (cảnh báo vàng). */
    private boolean requiresConfirmation;

    private SalaryAnomalyStatus status;

    /** Số tiền gợi ý để sửa nhanh 1 chạm (null nếu không có gợi ý hợp lý). */
    private Long suggestedCorrectedAmountVnd;

    private MarketRange realMarketRange;

    private InternalRange alumnectInternalRange;

    private String marketComparisonVi;

    private String advisoryMessageVi;

    /** "GEMINI" hoặc "LOCAL_FALLBACK" (bảng dải lương tham chiếu cục bộ). */
    private String source;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketRange {
        private long minVnd;
        private long medianVnd;
        private long maxVnd;
        /** Phân vị ước lượng của mức lương người dùng nhập trong dải thị trường (1-99). */
        private int percentileEstimate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InternalRange {
        /** null nếu chưa có mẫu nội bộ nào khớp. */
        private Long minVnd;
        private Long medianVnd;
        private Long maxVnd;
        private long sampleCount;
    }
}
