package com.alumnect.alumnect_backend.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRevenueOverviewResponse {
    private BigDecimal totalOwnedRevenue;
    private BigDecimal subscriptionRevenue;
    private BigDecimal disputeFeeRevenue;
    private BigDecimal currentMonthRevenue;
    private BigDecimal previousMonthRevenue;
    private BigDecimal monthGrowthPercent;
    private long successfulTransactionCount;
    private BigDecimal escrowHolding;
    private BigDecimal pendingMentorPayout;
    private BigDecimal pendingStudentRefund;
    private Instant from;
    private Instant to;
    private List<MonthlyRevenue> monthlyRevenue;
    private List<RevenueTransaction> transactions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenue {
        private String month;
        private String label;
        private BigDecimal subscriptionRevenue;
        private BigDecimal disputeFeeRevenue;
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueTransaction {
        private String id;
        private String sourceType;
        private String referenceCode;
        private String payerName;
        private String payerEmail;
        private String description;
        private String paymentMethod;
        private BigDecimal amount;
        private Instant occurredAt;
        private String status;
    }
}
