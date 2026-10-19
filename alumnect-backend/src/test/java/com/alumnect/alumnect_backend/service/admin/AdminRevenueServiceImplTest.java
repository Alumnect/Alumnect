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
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRevenueServiceImplTest {
    @Mock PaymentTransactionRepository paymentRepository;
    @Mock MentoringDisputeTicketRepository ticketRepository;
    @Mock MentoringPaymentLedgerRepository ledgerRepository;

    private AdminRevenueServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminRevenueServiceImpl(paymentRepository, ticketRepository, ledgerRepository);
    }

    @Test
    void separatesOwnedRevenueFromEscrowAndPendingDisbursements() {
        User payer = User.builder().email("mentor@alumnect.vn").build();
        payer.setProfile(UserProfile.builder().fullName("Mentor AlumNect").user(payer).build());
        PaymentTransaction subscription = PaymentTransaction.builder()
                .id(1L).user(payer).orderCode(20261015001L).amount(new BigDecimal("250000"))
                .paidAt(Instant.parse("2026-10-10T03:00:00Z")).paymentMethod("PAYOS").build();
        MentoringDisputeTicket fee = MentoringDisputeTicket.builder()
                .id(2L).ticketCode("DP-002").student(payer).disputeFee(new BigDecimal("20000"))
                .resolvedAt(Instant.parse("2026-10-11T03:00:00Z")).build();

        when(paymentRepository.findAllPaidRevenueTransactions()).thenReturn(List.of(subscription));
        when(ticketRepository.findAllResolvedFeeRevenue()).thenReturn(List.of(fee));
        when(ledgerRepository.sumAmountByTypeAndStatus(MentoringLedgerTransactionType.ESCROW_COLLECTION, MentoringLedgerStatus.SUCCEEDED)).thenReturn(new BigDecimal("500000"));
        when(ledgerRepository.sumAmountByTypeAndStatus(MentoringLedgerTransactionType.PAYOUT, MentoringLedgerStatus.SUCCEEDED)).thenReturn(new BigDecimal("300000"));
        when(ledgerRepository.sumAmountByTypeAndStatus(MentoringLedgerTransactionType.REFUND, MentoringLedgerStatus.SUCCEEDED)).thenReturn(new BigDecimal("50000"));
        when(ledgerRepository.sumAmountByTypeAndStatus(MentoringLedgerTransactionType.PAYOUT, MentoringLedgerStatus.PENDING)).thenReturn(new BigDecimal("100000"));
        when(ledgerRepository.sumAmountByTypeAndStatus(MentoringLedgerTransactionType.REFUND, MentoringLedgerStatus.PENDING)).thenReturn(BigDecimal.ZERO);

        AdminRevenueOverviewResponse response = service.getOverview(null, null);

        assertThat(response.getTotalOwnedRevenue()).isEqualByComparingTo("270000");
        assertThat(response.getSubscriptionRevenue()).isEqualByComparingTo("250000");
        assertThat(response.getDisputeFeeRevenue()).isEqualByComparingTo("20000");
        assertThat(response.getEscrowHolding()).isEqualByComparingTo("130000");
        assertThat(response.getPendingMentorPayout()).isEqualByComparingTo("100000");
        assertThat(response.getTransactions()).hasSize(2);
    }

    @Test
    void appliesSelectedPeriodOnlyToOwnedRevenueSummaryAndTransactions() {
        User payer = User.builder().email("mentor@alumnect.vn").build();
        PaymentTransaction oldPayment = PaymentTransaction.builder()
                .id(1L).user(payer).orderCode(1L).amount(new BigDecimal("100000"))
                .paidAt(Instant.parse("2026-01-01T00:00:00Z")).build();
        when(paymentRepository.findAllPaidRevenueTransactions()).thenReturn(List.of(oldPayment));
        when(ticketRepository.findAllResolvedFeeRevenue()).thenReturn(List.of());

        AdminRevenueOverviewResponse response = service.getOverview(
                Instant.parse("2026-10-01T00:00:00Z"), Instant.parse("2026-10-31T23:59:59Z"));

        assertThat(response.getTotalOwnedRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getTransactions()).isEmpty();
    }
}
