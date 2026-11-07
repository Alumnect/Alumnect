package com.alumnect.alumnect_backend.common.enums;

/**
 * Kết quả phân loại mức lương người dùng nhập khi đóng góp (AI A1) so với mặt bằng thị trường thực tế.
 */
public enum SalaryAnomalyStatus {

    /** Lương nằm trong dải thị trường phổ biến — lưu thẳng, không cần xác nhận. */
    NORMAL,

    /** Lương thấp hơn nhiều so với thị trường (nghi gõ thiếu chữ số 0) — cho phép gửi sau khi xác nhận. */
    BELOW_MARKET_WARNING,

    /** Cao hơn trần thị trường nhưng chưa quá bất thường (độ lệch ≤ 150%) — cho phép gửi sau khi xác nhận. */
    HIGH_ANOMALY_ALLOWED,

    /** Vượt ngưỡng bất thường nghiêm trọng (độ lệch &gt; 150% trần thị trường) — CHẶN CỨNG, không cho đăng bản ghi. */
    EXCESSIVE_ANOMALY_BLOCKED
}
