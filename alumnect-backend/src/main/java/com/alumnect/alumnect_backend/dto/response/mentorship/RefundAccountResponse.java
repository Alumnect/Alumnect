package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundAccountResponse {
    private String bankName;
    private String bankBin;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private Instant updatedAt;
}
