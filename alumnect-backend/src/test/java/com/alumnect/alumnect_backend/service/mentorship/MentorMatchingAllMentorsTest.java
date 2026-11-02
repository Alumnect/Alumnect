package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Set;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/** Request chung được gửi tới mọi Mentor đủ điều kiện (gói còn hạn); Mentor cùng ngành xếp trước. */
@ExtendWith(MockitoExtension.class)
class MentorMatchingAllMentorsTest {
    @Mock MentorProfileRepository mentorProfileRepository;
    @Mock MentorSupportedFieldRepository supportedFieldRepository;
    @Mock MentorSubscriptionRepository subscriptionRepository;
    @Mock MentoringRequestDistributionRepository distributionRepository;

    @Test void includesOtherIndustryMentorsButListsSameIndustryFirstAndKeepsExclusions() {
        MentorProfile otherIndustry = profile(1L, 11L);
        MentorProfile sameIndustry = profile(2L, 12L);
        MentorProfile memberOfRequest = profile(3L, 13L);
        MentorSupportedField field = MentorSupportedField.builder().mentorProfile(sameIndustry).build();
        when(supportedFieldRepository.findByIndustryId(5L)).thenReturn(List.of(field));
        MentorProfile withoutSubscription = profile(4L, 14L);
        when(mentorProfileRepository.findByMentorStatus(MentorStatus.ACTIVE))
                .thenReturn(List.of(otherIndustry, sameIndustry, memberOfRequest, withoutSubscription));
        when(subscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(validSubscription()));
        when(subscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(2L)).thenReturn(List.of(validSubscription()));
        when(subscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(4L)).thenReturn(List.of());

        MentorMatchingServiceImpl service = new MentorMatchingServiceImpl(
                mentorProfileRepository, supportedFieldRepository, subscriptionRepository, distributionRepository);
        List<MentorProfile> result = service.findMatchingMentors(5L, MentoringWorkingMode.ONLINE, MentoringType.INDIVIDUAL, Set.of(13L));

        assertThat(result).containsExactly(sameIndustry, otherIndustry);
    }

    private static com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription validSubscription() {
        return com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription.builder()
                .status(com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus.ACTIVE)
                .endDate(java.time.Instant.now().plusSeconds(86400)).build();
    }

    private static MentorProfile profile(Long id, Long userId) {
        User user = new User();
        user.setId(userId);
        user.setAccountStatus(AccountStatus.ACTIVE);
        MentorProfile profile = MentorProfile.builder().id(id).user(user).mentorStatus(MentorStatus.ACTIVE).build();
        return profile;
    }
}
