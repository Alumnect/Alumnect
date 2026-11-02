package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserRefundAccountRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.UserRefundAccount;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefundAccountResolverTest {
    @Mock UserRefundAccountRepository refundAccountRepository;
    @Mock MentorProfileRepository mentorProfileRepository;
    @Mock MentorPayoutAccountRepository payoutAccountRepository;
    @InjectMocks RefundAccountResolver resolver;

    @Test
    void declaredRefundAccountWinsOverMentorAccount() {
        UserRefundAccount declared = UserRefundAccount.builder().bankName("VCB").bankBin("970436")
                .bankAccountNumber("111111").bankAccountHolder("A").build();
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.of(declared));
        assertThat(resolver.find(1L)).containsSame(declared);
    }

    @Test
    void fallsBackToMentorPayoutAccountWhenNothingDeclared() {
        MentorProfile profile = new MentorProfile();
        profile.setId(9L);
        MentorPayoutAccount payout = MentorPayoutAccount.builder().bankName("ACB").bankBin("970416")
                .bankAccountNumber("24710327").bankAccountHolder("PHAN TRUNG HIEU").build();
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(payoutAccountRepository.findByMentorProfileId(9L)).thenReturn(Optional.of(payout));
        assertThat(resolver.find(1L)).get().extracting(UserRefundAccount::getBankBin, UserRefundAccount::getBankAccountNumber)
                .containsExactly("970416", "24710327");
    }

    @Test
    void emptyWhenNoAccountAnywhere() {
        when(refundAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThat(resolver.exists(1L)).isFalse();
    }
}
