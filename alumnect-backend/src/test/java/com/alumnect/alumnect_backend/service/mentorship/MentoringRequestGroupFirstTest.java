package com.alumnect.alumnect_backend.service.mentorship;

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
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MentoringRequestGroupFirstTest {

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

    MentoringRequestServiceImpl requestService;

    @BeforeEach
    void setup() {
        requestService = new MentoringRequestServiceImpl(
                userRepository, userProfileRepository, industryRepository, userTermsAcceptanceRepository,
                mentoringRequestRepository, mentoringRequestAttachmentRepository, mentoringRequestDistributionRepository,
                mentorProfileRepository, mentorSubscriptionRepository, mentorSupportedFieldRepository,
                mentorMatchingService, mentoringProperties, mentoringConversationService, mentoringTaskRepository,
                mentoringGroupService, mentoringGroupRepository, mentoringGroupMemberRepository,
                mentoringRequestMemberRepository, mentoringRules, requestLifecycleService, mentorReputationService,
                notificationService
        );
    }

    @Test
    @DisplayName("Group-First: Yêu cầu nhóm bắt buộc phải có groupId hợp lệ")
    void createGroupRequest_missingGroupId_throwsBadRequest() {
        User student = createStudentUser(1L, "student@alumnect.vn");
        when(userRepository.findByEmail("student@alumnect.vn")).thenReturn(Optional.of(student));

        CreateMentoringRequestRequest req = new CreateMentoringRequestRequest();
        req.setTitle("Cần cố vấn Capstone");
        req.setDescription("Mô tả chi tiết nhu cầu mentoring cho đồ án tốt nghiệp.");
        req.setParticipationType(MentoringType.GROUP);
        req.setGroupId(null); // Thiếu groupId

        assertThatThrownBy(() -> requestService.createMentoringRequest("student@alumnect.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chọn nhóm");
    }

    @Test
    @DisplayName("Snapshot Isolation: Chỉ lưu các thành viên JOINED vào mentoring_request_members, loại bỏ PENDING")
    void createGroupRequest_snapshotOnlyJoinedMembers() {
        User leader = createStudentUser(1L, "leader@alumnect.vn");
        User joinedMember = createStudentUser(2L, "member@alumnect.vn");

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(userRepository.findById(1L)).thenReturn(Optional.of(leader));
        when(userRepository.findById(2L)).thenReturn(Optional.of(joinedMember));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(anyLong(), anyString()))
                .thenReturn(Optional.of(new UserTermsAcceptance()));
        when(industryRepository.findById(10L)).thenReturn(Optional.of(Industry.builder().id(10L).name("CNTT").build()));

        MentoringGroup group = MentoringGroup.builder()
                .id(100L)
                .name("Nhóm Capstone Spring")
                .leader(leader)
                .status(MentoringGroupStatus.ACTIVE)
                .build();
        when(mentoringGroupRepository.findById(100L)).thenReturn(Optional.of(group));

        MentoringGroupMember mLeader = MentoringGroupMember.builder().id(1L).group(group).user(leader).status(MentoringGroupMemberStatus.JOINED).build();
        MentoringGroupMember mJoined = MentoringGroupMember.builder().id(2L).group(group).user(joinedMember).status(MentoringGroupMemberStatus.JOINED).build();
        // findByGroupIdAndStatusIn only returns JOINED and ACTIVE members, excluding PENDING
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(mLeader, mJoined));

        when(mentoringRequestRepository.save(any(MentoringRequest.class))).thenAnswer(invocation -> {
            MentoringRequest r = invocation.getArgument(0);
            r.setId(999L);
            r.setCreatedAt(Instant.now());
            return r;
        });

        CreateMentoringRequestRequest req = new CreateMentoringRequestRequest();
        req.setTitle("Cần cố vấn Capstone");
        req.setDescription("Mô tả chi tiết nhu cầu mentoring cho đồ án tốt nghiệp.");
        req.setIndustryId(10L);
        req.setParticipationType(MentoringType.GROUP);
        req.setTaskType(MentoringTaskType.CAPSTONE_ADVICE);
        req.setWorkingMode(MentoringWorkingMode.ONLINE);
        req.setGroupId(100L);

        CreateMentoringRequestResponse response = requestService.createMentoringRequest("leader@alumnect.vn", req);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(999L);

        // Snapshot chỉ lưu leader (1L) và joinedMember (2L), loại bỏ pendingMember (3L)
        verify(mentoringRequestMemberRepository, times(2)).save(any(MentoringRequestMember.class));
        verify(mentoringRequestMemberRepository).save(argThat(s -> s.getUser().getId().equals(1L)));
        verify(mentoringRequestMemberRepository).save(argThat(s -> s.getUser().getId().equals(2L)));
        verify(mentoringRequestMemberRepository, never()).save(argThat(s -> s.getUser().getId().equals(3L)));
    }

    @Test
    @DisplayName("Mentor Conflict Prevention: Direct Request không được chọn Mentor là thành viên trong nhóm tham gia")
    void createDirectRequest_mentorIsGroupParticipant_throwsBadRequest() {
        User leader = createStudentUser(1L, "leader@alumnect.vn");
        User mentorUser = createStudentUser(2L, "mentor_in_group@alumnect.vn");

        when(userRepository.findByEmail("leader@alumnect.vn")).thenReturn(Optional.of(leader));
        when(mentoringProperties.getVersion()).thenReturn("1.0");
        when(userTermsAcceptanceRepository.findByUserIdAndTermsVersion(anyLong(), anyString()))
                .thenReturn(Optional.of(new UserTermsAcceptance()));
        when(industryRepository.findById(10L)).thenReturn(Optional.of(Industry.builder().id(10L).name("CNTT").build()));

        // Mock mentor profile target
        MentorProfile mentorProfile = MentorProfile.builder()
                .id(88L)
                .user(mentorUser)
                .mentorStatus(MentorStatus.ACTIVE)
                .mentoringType(MentoringType.GROUP)
                .build();
        when(mentorProfileRepository.findById(88L)).thenReturn(Optional.of(mentorProfile));

        // Mock active subscription for mentor
        MentorSubscription subscription = MentorSubscription.builder()
                .id(1L)
                .mentorProfile(mentorProfile)
                .status(MentorSubscriptionStatus.ACTIVE)
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();
        when(mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(88L))
                .thenReturn(List.of(subscription));
        when(mentorSupportedFieldRepository.existsByMentorProfileIdAndIndustryId(88L, 10L))
                .thenReturn(true);

        MentoringGroup group = MentoringGroup.builder()
                .id(100L)
                .name("Nhóm Capstone")
                .leader(leader)
                .status(MentoringGroupStatus.ACTIVE)
                .build();
        when(mentoringGroupRepository.findById(100L)).thenReturn(Optional.of(group));

        MentoringGroupMember mLeader = MentoringGroupMember.builder().id(1L).group(group).user(leader).status(MentoringGroupMemberStatus.JOINED).build();
        MentoringGroupMember mMentor = MentoringGroupMember.builder().id(2L).group(group).user(mentorUser).status(MentoringGroupMemberStatus.JOINED).build();
        when(mentoringGroupMemberRepository.findByGroupIdAndStatusIn(eq(100L), any()))
                .thenReturn(List.of(mLeader, mMentor));

        CreateMentoringRequestRequest req = new CreateMentoringRequestRequest();
        req.setTitle("Cần cố vấn Capstone");
        req.setDescription("Mô tả chi tiết nhu cầu mentoring cho đồ án tốt nghiệp.");
        req.setIndustryId(10L);
        req.setParticipationType(MentoringType.GROUP);
        req.setTaskType(MentoringTaskType.CAPSTONE_ADVICE);
        req.setWorkingMode(MentoringWorkingMode.ONLINE);
        req.setGroupId(100L);
        req.setMentorId(88L); // Chỉ định mentor chính là thành viên trong nhóm

        assertThatThrownBy(() -> requestService.createMentoringRequest("leader@alumnect.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mentor không thể là thành viên trong yêu cầu Mentoring của chính mình");
    }

    private User createStudentUser(Long id, String email) {
        Role role = Role.builder().id(1L).name("STUDENT").build();
        return User.builder()
                .id(id)
                .email(email)
                .accountStatus(AccountStatus.ACTIVE)
                .role(role)
                .build();
    }
}
