package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDisputeTicketRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminRevenueOverviewResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminRevenueServiceImpl implements AdminRevenueService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MentoringDisputeTicketRepository disputeTicketRepository;
    private final MentoringPaymentLedgerRepository ledgerRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminRevenueOverviewResponse getOverview(Instant from, Instant to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("Thời gian bắt đầu không được sau thời gian kết thúc");
        }

        List<PaymentTransaction> subscriptions = paymentTransactionRepository.findAllPaidRevenueTransactions();
        List<MentoringDisputeTicket> disputeFees = disputeTicketRepository.findAllResolvedFeeRevenue();

        BigDecimal subscriptionRevenue = subscriptions.stream()
                .filter(item -> inRange(item.getPaidAt(), from, to))
                .map(PaymentTransaction::getAmount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal disputeFeeRevenue = disputeFees.stream()
                .filter(item -> inRange(item.getResolvedAt(), from, to))
                .map(MentoringDisputeTicket::getDisputeFee)
                .reduce(ZERO, BigDecimal::add);

        YearMonth currentMonth = YearMonth.now(BUSINESS_ZONE);
        YearMonth previousMonth = currentMonth.minusMonths(1);
        BigDecimal currentMonthRevenue = revenueForMonth(currentMonth, subscriptions, disputeFees);
        BigDecimal previousMonthRevenue = revenueForMonth(previousMonth, subscriptions, disputeFees);

        List<AdminRevenueOverviewResponse.RevenueTransaction> transactions = new ArrayList<>();
        subscriptions.stream()
                .filter(item -> inRange(item.getPaidAt(), from, to))
                .map(this::toSubscriptionTransaction)
                .forEach(transactions::add);
        disputeFees.stream()
                .filter(item -> inRange(item.getResolvedAt(), from, to))
                .map(this::toDisputeTransaction)
                .forEach(transactions::add);
        transactions.sort(Comparator.comparing(
                AdminRevenueOverviewResponse.RevenueTransaction::getOccurredAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        BigDecimal collected = sumLedger(MentoringLedgerTransactionType.ESCROW_COLLECTION, MentoringLedgerStatus.SUCCEEDED);
        BigDecimal paidOut = sumLedger(MentoringLedgerTransactionType.PAYOUT, MentoringLedgerStatus.SUCCEEDED);
        BigDecimal refunded = sumLedger(MentoringLedgerTransactionType.REFUND, MentoringLedgerStatus.SUCCEEDED);
        BigDecimal allDisputeFees = disputeFees.stream()
                .map(MentoringDisputeTicket::getDisputeFee)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal escrowHolding = collected.subtract(paidOut).subtract(refunded).subtract(allDisputeFees).max(ZERO);

        return AdminRevenueOverviewResponse.builder()
                .totalOwnedRevenue(subscriptionRevenue.add(disputeFeeRevenue))
                .subscriptionRevenue(subscriptionRevenue)
                .disputeFeeRevenue(disputeFeeRevenue)
                .currentMonthRevenue(currentMonthRevenue)
                .previousMonthRevenue(previousMonthRevenue)
                .monthGrowthPercent(growthPercent(currentMonthRevenue, previousMonthRevenue))
                .successfulTransactionCount(transactions.size())
                .escrowHolding(escrowHolding)
                .pendingMentorPayout(sumLedger(MentoringLedgerTransactionType.PAYOUT, MentoringLedgerStatus.PENDING))
                .pendingStudentRefund(sumLedger(MentoringLedgerTransactionType.REFUND, MentoringLedgerStatus.PENDING))
                .from(from)
                .to(to)
                .monthlyRevenue(buildMonthlyRevenue(subscriptions, disputeFees))
                .transactions(transactions.stream().limit(500).toList())
                .build();
    }

    private List<AdminRevenueOverviewResponse.MonthlyRevenue> buildMonthlyRevenue(
            List<PaymentTransaction> subscriptions,
            List<MentoringDisputeTicket> disputeFees) {
        YearMonth now = YearMonth.now(BUSINESS_ZONE);
        Map<YearMonth, BigDecimal[]> months = new LinkedHashMap<>();
        for (int index = 11; index >= 0; index--) {
            months.put(now.minusMonths(index), new BigDecimal[]{ZERO, ZERO});
        }
        subscriptions.forEach(item -> addToMonth(months, item.getPaidAt(), item.getAmount(), 0));
        disputeFees.forEach(item -> addToMonth(months, item.getResolvedAt(), item.getDisputeFee(), 1));

        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MM/yyyy", Locale.forLanguageTag("vi-VN"));
        return months.entrySet().stream().map(entry -> {
            BigDecimal subscription = entry.getValue()[0];
            BigDecimal dispute = entry.getValue()[1];
            return AdminRevenueOverviewResponse.MonthlyRevenue.builder()
                    .month(entry.getKey().toString())
                    .label(entry.getKey().format(labelFormatter))
                    .subscriptionRevenue(subscription)
                    .disputeFeeRevenue(dispute)
                    .totalRevenue(subscription.add(dispute))
                    .build();
        }).toList();
    }

    private void addToMonth(Map<YearMonth, BigDecimal[]> months, Instant occurredAt, BigDecimal amount, int index) {
        if (occurredAt == null || amount == null) return;
        BigDecimal[] values = months.get(YearMonth.from(occurredAt.atZone(BUSINESS_ZONE)));
        if (values != null) values[index] = values[index].add(amount);
    }

    private BigDecimal revenueForMonth(YearMonth month, List<PaymentTransaction> subscriptions,
                                       List<MentoringDisputeTicket> disputeFees) {
        BigDecimal subscription = subscriptions.stream()
                .filter(item -> isMonth(item.getPaidAt(), month))
                .map(PaymentTransaction::getAmount).reduce(ZERO, BigDecimal::add);
        BigDecimal dispute = disputeFees.stream()
                .filter(item -> isMonth(item.getResolvedAt(), month))
                .map(MentoringDisputeTicket::getDisputeFee).reduce(ZERO, BigDecimal::add);
        return subscription.add(dispute);
    }

    private AdminRevenueOverviewResponse.RevenueTransaction toSubscriptionTransaction(PaymentTransaction item) {
        return AdminRevenueOverviewResponse.RevenueTransaction.builder()
                .id("SUB-" + item.getId())
                .sourceType("MENTOR_SUBSCRIPTION")
                .referenceCode(String.valueOf(item.getOrderCode()))
                .payerName(displayName(item.getUser()))
                .payerEmail(item.getUser().getEmail())
                .description("Phí gói dịch vụ Mentor")
                .paymentMethod(item.getPaymentMethod())
                .amount(item.getAmount())
                .occurredAt(item.getPaidAt())
                .status("PAID")
                .build();
    }

    private AdminRevenueOverviewResponse.RevenueTransaction toDisputeTransaction(MentoringDisputeTicket item) {
        return AdminRevenueOverviewResponse.RevenueTransaction.builder()
                .id("FEE-" + item.getId())
                .sourceType("DISPUTE_FEE")
                .referenceCode(item.getTicketCode())
                .payerName(displayName(item.getStudent()))
                .payerEmail(item.getStudent().getEmail())
                .description("Phí xử lý tranh chấp Mentoring")
                .paymentMethod("ESCROW")
                .amount(item.getDisputeFee())
                .occurredAt(item.getResolvedAt())
                .status("RECOGNIZED")
                .build();
    }

    private BigDecimal sumLedger(MentoringLedgerTransactionType type, MentoringLedgerStatus status) {
        BigDecimal value = ledgerRepository.sumAmountByTypeAndStatus(type, status);
        return value == null ? ZERO : value;
    }

    private boolean inRange(Instant value, Instant from, Instant to) {
        return value != null && (from == null || !value.isBefore(from)) && (to == null || !value.isAfter(to));
    }

    private boolean isMonth(Instant value, YearMonth month) {
        return value != null && YearMonth.from(value.atZone(BUSINESS_ZONE)).equals(month);
    }

    private BigDecimal growthPercent(BigDecimal current, BigDecimal previous) {
        if (previous.signum() == 0) return current.signum() == 0 ? ZERO : new BigDecimal("100.00");
        return current.subtract(previous).multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP);
    }

    private String displayName(User user) {
        return user.getProfile() != null && user.getProfile().getFullName() != null
                ? user.getProfile().getFullName() : user.getEmail();
    }
}
