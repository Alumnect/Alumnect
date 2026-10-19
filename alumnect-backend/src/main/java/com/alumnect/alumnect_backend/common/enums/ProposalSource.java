package com.alumnect.alumnect_backend.common.enums;

/**
 * Nguồn gốc đề xuất của Deal Ticket (UC104).
 * - REQUEST_ACCEPTANCE: Mentor chấp nhận theo yêu cầu ban đầu của Student (giữ nguyên điều kiện và giá đề xuất).
 * - RENEGOTIATION: Mentor điều chỉnh lại điều khoản (giá, deadline, phạm vi...) hoặc tự tạo Deal Ticket mới.
 */
public enum ProposalSource {
    REQUEST_ACCEPTANCE,
    RENEGOTIATION
}
