package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.*;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-68 Mentoring - Group Mentoring Request (Group-First).
 * Report sheet : FE-68 (Report5_Unit_Test.xlsx)
 * Functions    : MentoringRequestServiceImpl.createMentoringRequest() (group branch),
 *                MentorMatchingServiceImpl.findMatchingMentors()
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FE-68 Mentoring - Group Mentoring Request (Group-First)")
class FE68_GroupMentoringRequestTest {

    @Mock UserRepository userRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock IndustryRepository industryRepository;
    @Mock UserTermsAcceptanceRepository userTermsAcceptanceRepository;
    @Mock MentoringRequestRepository mentoringRequestRepository;
    @Mock MentoringRequestAttachmentRepository mentoringRequestAttachmentRepository;
    @Mock MentoringRequestDistributionRepository mentoringRequestDistributionRepository;
    @Mock MentorProfileRepository mentorProfileRepository;
    @Mock MentorSubscriptionRepository mentorSubscriptionRepository;
    @Mock MentorSupportedFieldRepository mentorSupportedFieldRepository;
    @Mock MentorMatchingService mentorMatchingService;
    @Mock MentoringProperties mentoringProperties;
    @Mock MentoringConversationService mentoringConversationService;
    @Mock MentoringTaskRepository mentoringTaskRepository;
    @Mock MentoringGroupService mentoringGroupService;
    @Mock MentoringGroupRepository mentoringGroupRepository;
    @Mock MentoringGroupMemberRepository mentoringGroupMemberRepository;
    @Mock MentoringRequestMemberRepository mentoringRequestMemberRepository;
    @Mock NotificationService notificationService;
    @Mock MentoringRules mentoringRules;
    @Mock MentoringRequestLifecycleService requestLifecycleService;
    @Mock MentorReputationService mentorReputationService;

    private MentoringRequestServiceImpl requestService;

    private static final String LEADER_EMAIL = "leader@alumnect.vn";

    private User leader;
    private User member2;
    private User member3;
    private MentoringGroup group;

    @BeforeEach
    void setUp() {
        requestService = new MentoringRequestServiceImpl(
                userRepository, userProfileRepository, industryRepository, userTermsAcceptanceRepository,
                mentoringRequestRepository, mentoringRequestAttachmentRepository, mentoringRequestDistributionRepository,
                mentorProfileRepository, mentorSubscriptionRepository, mentorSupportedFieldRepository,
                mentorMatchingService, mentoringProperties, mentoringConversationService, mentoringTaskRepository,
                mentoringGroupService, mentoringGroupRepository, mentoringGroupMemberRepository,
                mentoringRequestMemberRepository, mentoringRules, requestLifecycleService, mentorReputationService,
                notificationService);

        leader = student(1L, LEADER_EMAIL);
        member2 = student(2L, "member2@alumnect.vn");
        member3 = student(3L, "member3@alumnect.vn");
        group = MentoringGroup.builder().id(100L).name("Nhóm Capstone").leader(leader)
                .status(MentoringGroupStatus.ACTIVE).build();

        when(userRepository.findByEmail(LEADER_EMAIL)).thenReturn(Optional.of(leader));
        when(userRepository.findById(1L)).thenReturn(Optional.of(leader));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member2));
        when(userRepository.findById(3L)).thenReturn(Optional.of(member3));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(anyLong(), anyString()))
                .thenReturn(Optional.of(new UserTermsAcceptance()));
        when(industryRepository.findById(10L)).thenReturn(Optional.of(Industry.builder().id(10L).name("CNTT").build()));
        when(mentoringGroupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(mentoringRequestRepository.save(any(MentoringRequest.class))).thenAnswer(inv -> {
            MentoringRequest r = inv.getArgument(0);
            r.setId(999L);
            r.setCreatedAt(Instant.now());
            return r;
        });
    }

    private User student(Long id, String email) {
        return User.builder().id(id).email(email).accountStatus(AccountStatus.ACTIVE)
                .role(Role.builder().id(1L).name("STUDENT").build()).build();
    }

    private MentoringGroupMember joined(User user) {
        return MentoringGroupMember.builder().id(user.getId()).group(group).user(user)
                .status(MentoringGroupMemberStatus.JOINED).build();
    }

    private CreateMentoringRequestRequest request(MentoringType type, Long groupId) {
        CreateMentoringRequestRequest req = new CreateMentoringRequestRequest();
        req.setTitle("Cần cố vấn Capstone");
        req.setDescription("Mô tả chi tiết nhu cầu mentoring cho đồ án tốt nghiệp.");
        req.setIndustryId(10L);
        req.setParticipationType(type);
        req.setTaskType(MentoringTaskType.CAPSTONE_ADVICE);
        req.setWorkingMode(MentoringWorkingMode.ONLINE);
        req.setGroupId(groupId);
        return req;
    }

    private MentorProfile mentor(Long profileId, User user, MentoringType type) {
        MentorProfile profile = MentorProfile.builder().id(profileId).user(user).mentorStatus(MentorStatus.ACTIVE)
                .mentoringType(type).build();
        when(mentorProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(profileId))
                .thenReturn(List.of(MentorSubscription.builder().id(1L).mentorProfile(profile)
                        .status(MentorSubscriptionStatus.ACTIVE).endDate(Instant.now().plus(30, ChronoUnit.DAYS)).build()));
        when(mentorSupportedFieldRepository.existsByMentorProfileIdAndIndustryId(profileId, 10L)).thenReturn(true);
        return profile;
    }

    // ================= createMentoringRequest() - group branch =================

    @Test
    @DisplayName("UTCID01 - Leader of ACTIVE group 100 -> snapshot saves only JOINED members (leader, user 2)")
    void utcid01_createGroupRequest_snapshotJoinedMembers() {
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(joined(leader), joined(member2)));

        CreateMentoringRequestResponse response =
                requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, 100L));

        assertThat(response.getId()).isEqualTo(999L);
        ArgumentCaptor<MentoringRequest> saved = ArgumentCaptor.forClass(MentoringRequest.class);
        verify(mentoringRequestRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        assertThat(saved.getAllValues().get(0).getGroup()).isSameAs(group);
        verify(mentoringRequestMemberRepository, times(2)).save(any(MentoringRequestMember.class));
        verify(mentoringRequestMemberRepository, never()).save(argThat(s -> s.getUser().getId().equals(3L)));
    }

    @Test
    @DisplayName("UTCID02 - GROUP without groupId and memberIds -> BadRequestException")
    void utcid02_createGroupRequest_missingGroup() {
        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn nhóm Mentoring để tạo yêu cầu nhóm");
    }

    @Test
    @DisplayName("UTCID03 - INDIVIDUAL with groupId -> BadRequestException")
    void utcid03_createRequest_groupInfoForIndividual() {
        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.INDIVIDUAL, 100L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thông tin nhóm chỉ áp dụng khi chọn hình thức Nhóm");
    }

    @Test
    @DisplayName("UTCID04 - GROUP with unknown groupId -> ResourceNotFoundException")
    void utcid04_createGroupRequest_groupNotFound() {
        when(mentoringGroupRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, 404L)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy nhóm Mentoring đã chọn");
    }

    @Test
    @DisplayName("UTCID05 - GROUP with a CLOSED group -> BadRequestException")
    void utcid05_createGroupRequest_groupClosed() {
        group.setStatus(MentoringGroupStatus.CLOSED);

        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, 100L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Nhóm Mentoring được chọn đã đóng hoặc không còn hoạt động");
    }

    @Test
    @DisplayName("UTCID06 - Requester is not the group leader -> ForbiddenException")
    void utcid06_createGroupRequest_notLeader() {
        group.setLeader(member2);

        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, 100L)))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ trưởng nhóm mới có quyền tạo yêu cầu Mentoring cho nhóm");
    }

    @Test
    @DisplayName("UTCID07 - Direct request to a Mentor who is a JOINED member of the group -> BadRequestException")
    void utcid07_createGroupRequest_mentorIsParticipant() {
        MentorProfile mentorProfile = mentor(88L, member2, MentoringType.GROUP);
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(joined(leader), joined(member2)));
        CreateMentoringRequestRequest req = request(MentoringType.GROUP, 100L);
        req.setMentorId(mentorProfile.getId());

        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mentor không thể là thành viên trong yêu cầu Mentoring của chính mình");
    }

    @Test
    @DisplayName("UTCID08 - Direct GROUP request to an INDIVIDUAL-only Mentor -> BadRequestException")
    void utcid08_createGroupRequest_mentorIndividualOnly() {
        mentor(88L, student(50L, "mentor@alumnect.vn"), MentoringType.INDIVIDUAL);
        CreateMentoringRequestRequest req = request(MentoringType.GROUP, 100L);
        req.setMentorId(88L);

        assertThatThrownBy(() -> requestService.createMentoringRequest(LEADER_EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Mentor này hiện không nhận mentoring theo nhóm");
    }

    @Test
    @DisplayName("UTCID09 - Direct GROUP request to a BOTH Mentor -> DIRECT/OPEN, matchedCount 1, no auto-matching")
    void utcid09_createGroupRequest_directToBothMentor() {
        mentor(88L, student(50L, "mentor@alumnect.vn"), MentoringType.BOTH);
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(joined(leader)));
        CreateMentoringRequestRequest req = request(MentoringType.GROUP, 100L);
        req.setMentorId(88L);

        CreateMentoringRequestResponse response = requestService.createMentoringRequest(LEADER_EMAIL, req);

        assertThat(response.getRequestType()).isEqualTo(MentoringRequestType.DIRECT);
        assertThat(response.getStatus()).isEqualTo(MentoringRequestStatus.OPEN);
        assertThat(response.getMatchedCount()).isEqualTo(1);
        ArgumentCaptor<MentoringRequestDistribution> distribution = ArgumentCaptor.forClass(MentoringRequestDistribution.class);
        verify(mentoringRequestDistributionRepository).save(distribution.capture());
        assertThat(distribution.getValue().getStatus()).isEqualTo(MentoringDistributionStatus.PENDING);
        verify(mentorMatchingService, never()).findMatchingMentors(any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID10 - GROUP with memberIds [2, 3] and no groupId -> group created from the members")
    void utcid10_createGroupRequest_legacyMemberIds() {
        MentoringGroup created = MentoringGroup.builder().id(200L).name("Nhóm tạm").leader(leader)
                .status(MentoringGroupStatus.ACTIVE).build();
        when(mentoringGroupService.createForRequest(eq(leader), anyString(), eq(List.of(2L, 3L)))).thenReturn(created);
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(200L), any()))
                .thenReturn(List.of(joined(member2), joined(member3)));
        CreateMentoringRequestRequest req = request(MentoringType.GROUP, null);
        req.setMemberIds(List.of(2L, 3L));

        requestService.createMentoringRequest(LEADER_EMAIL, req);

        verify(mentoringGroupService).createForRequest(leader, "Cần cố vấn Capstone", List.of(2L, 3L));
        verify(mentoringRequestMemberRepository, times(3)).save(any(MentoringRequestMember.class));
    }

    @Test
    @DisplayName("UTCID11 - Group request created -> members 2 and 3 notified (REQUEST_CREATED), leader not")
    void utcid11_createGroupRequest_notifiesMembers() {
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(joined(leader), joined(member2), joined(member3)));

        requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, 100L));

        verify(notificationService).sendMentoringGroupNotification(eq(leader), eq(member2), eq(group),
                eq("REQUEST_CREATED"), eq("999"), eq("Yêu cầu Mentoring mới của nhóm"), anyString());
        verify(notificationService).sendMentoringGroupNotification(eq(leader), eq(member3), eq(group),
                eq("REQUEST_CREATED"), eq("999"), eq("Yêu cầu Mentoring mới của nhóm"), anyString());
        verify(notificationService, never()).sendMentoringGroupNotification(any(), eq(leader), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("UTCID12 - General group request -> matching excludes leader and member 2, distribution stored")
    void utcid12_createGroupRequest_matchingExcludesParticipants() {
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(joined(leader), joined(member2)));
        MentorProfile found = MentorProfile.builder().id(5L).user(student(60L, "m@alumnect.vn")).build();
        when(mentorMatchingService.findMatchingMentors(eq(10L), eq(MentoringWorkingMode.ONLINE),
                eq(MentoringType.GROUP), eq(Set.of(1L, 2L)))).thenReturn(List.of(found));
        when(mentorMatchingService.distributeRequestToMentors(any(MentoringRequest.class), eq(List.of(found)))).thenReturn(1);

        CreateMentoringRequestResponse response =
                requestService.createMentoringRequest(LEADER_EMAIL, request(MentoringType.GROUP, 100L));

        verify(mentorMatchingService).findMatchingMentors(10L, MentoringWorkingMode.ONLINE, MentoringType.GROUP, Set.of(1L, 2L));
        assertThat(response.getMatchedCount()).isEqualTo(1);
    }

    // ================= MentorMatchingServiceImpl.findMatchingMentors() =================

    @Test
    @DisplayName("UTCID13 - Mentors A (other industry), B (same industry), C (participant), D (no subscription) -> [B, A]")
    void utcid13_findMatchingMentors_excludesParticipants() {
        MentorProfile otherIndustry = matchProfile(1L, 11L);
        MentorProfile sameIndustry = matchProfile(2L, 12L);
        MentorProfile participant = matchProfile(3L, 13L);
        MentorProfile withoutSubscription = matchProfile(4L, 14L);
        when(mentorSupportedFieldRepository.findByIndustryId(5L))
                .thenReturn(List.of(MentorSupportedField.builder().mentorProfile(sameIndustry).build()));
        when(mentorProfileRepository.findByMentorStatus(MentorStatus.ACTIVE))
                .thenReturn(List.of(otherIndustry, sameIndustry, participant, withoutSubscription));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(validSubscription()));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(2L)).thenReturn(List.of(validSubscription()));
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(4L)).thenReturn(List.of());

        MentorMatchingServiceImpl matching = new MentorMatchingServiceImpl(
                mentorProfileRepository, mentorSupportedFieldRepository, mentorSubscriptionRepository,
                mentoringRequestDistributionRepository);
        List<MentorProfile> result = matching.findMatchingMentors(5L, MentoringWorkingMode.ONLINE,
                MentoringType.INDIVIDUAL, Set.of(13L));

        assertThat(result).containsExactly(sameIndustry, otherIndustry);
    }

    private static MentorSubscription validSubscription() {
        return MentorSubscription.builder().status(MentorSubscriptionStatus.ACTIVE)
                .endDate(Instant.now().plusSeconds(86400)).build();
    }

    private static MentorProfile matchProfile(Long id, Long userId) {
        User user = new User();
        user.setId(userId);
        user.setAccountStatus(AccountStatus.ACTIVE);
        return MentorProfile.builder().id(id).user(user).mentorStatus(MentorStatus.ACTIVE).build();
    }
}
