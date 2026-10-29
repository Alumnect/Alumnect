package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorReviewRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorReviewRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorReviewResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskReportResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorReview;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentorReputationServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskCompletionService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskResolutionService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTicketService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWorkLogService;
import com.alumnect.alumnect_backend.service.mentorship.RefundAccountResolver;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit Test Suite cho FE-60: Mentoring - Task Result, Payment Report & Reviews
 * Tổng cộng 13 Test Cases (UTCID01 -> UTCID13).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-60 Mentoring - Task Result, Payment Report & Reviews")
class FE60_TaskReportReviewTest {

    @Mock
    private MentoringTaskRepository taskRepository;

    @Mock
    private MentoringTaskPaymentRepository paymentRepository;

    @Mock
    private MentoringPaymentLedgerRepository ledgerRepository;

    @Mock
    private MentoringWorkLogRepository workLogRepository;

    @Mock
    private MentoringTaskDeadlineExtensionRepository extensionRepository;

    @Mock
    private MentoringTaskAmendmentRepository amendmentRepository;

    @Mock
    private MentoringTaskMapper taskMapper;

    @Mock
    private MentoringWorkLogService workLogService;

    @Mock
    private MentoringTaskResolutionService resolutionService;

    @Mock
    private MentoringTaskCompletionService completionService;

    @Mock
    private MentoringTicketService ticketService;

    @Mock
    private MentoringGroupService mentoringGroupService;

    @Mock
    private RefundAccountResolver refundAccountResolver;

    @Mock
    private MentoringRules mentoringRules;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private MentorReviewRepository mentorReviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private MentoringTaskServiceImpl taskService;
    private MentorReputationServiceImpl reputationService;

    private static final Long STUDENT_USER_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long OTHER_USER_ID = 99L;
    private static final Long TASK_ID = 100L;
    private static final Long MENTOR_PROFILE_ID = 50L;
    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";

    private User studentUser;
    private User mentorUser;
    private MentoringTask task;
    private MentoringDeal deal;
    private MentorProfile mentorProfile;
    private Validator validator;

    @BeforeEach
    void setUp() {
        taskService = new MentoringTaskServiceImpl(
                taskRepository,
                paymentRepository,
                ledgerRepository,
                workLogRepository,
                extensionRepository,
                amendmentRepository,
                taskMapper,
                workLogService,
                resolutionService,
                completionService,
                ticketService,
                mentoringGroupService,
                refundAccountResolver,
                mentoringRules
        );

        reputationService = new MentorReputationServiceImpl(
                mentorProfileRepository,
                mentorReviewRepository,
                taskRepository,
                userRepository,
                userProfileRepository
        );

        validator = Validation.buildDefaultValidatorFactory().getValidator();

        studentUser = User.builder().id(STUDENT_USER_ID).email(STUDENT_EMAIL).build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email("mentor@fpt.edu.vn").build();

        deal = MentoringDeal.builder()
                .id(500L)
                .student(studentUser)
                .mentor(mentorUser)
                .agreedPrice(BigDecimal.valueOf(1000000))
                .isPaid(true)
                .build();

        task = MentoringTask.builder()
                .id(TASK_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .deal(deal)
                .request(MentoringRequest.builder().id(200L).build())
                .status(MentoringTaskStatus.COMPLETED)
                .taskTitle("Hướng dẫn kiến trúc Microservice")
                .taskScope("Xây dựng service auth và payment")
                .agreedPrice(BigDecimal.valueOf(1000000))
                .createdAt(Instant.now().minusSeconds(86400 * 10))
                .completedAt(Instant.now())
                .build();

        mentorProfile = MentorProfile.builder()
                .id(MENTOR_PROFILE_ID)
                .user(mentorUser)
                .reputationScore(100)
                .rating(BigDecimal.valueOf(5.00))
                .reviewCount(5)
                .completedTasks(5)
                .build();
    }

    // ================= UTCID01 -> UTCID03: getTaskReport =================

    @Test
    @DisplayName("UTCID01 - Participant; task COMPLETED with ledgers -> getTaskReport -> Report returned")
    void utcid01_getTaskReport_ok() {
        // Given
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        // When
        MentoringTaskReportResponse response = taskService.getTaskReport(STUDENT_USER_ID, TASK_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getOriginalPrice()).isEqualTo(BigDecimal.valueOf(1000000));
        assertThat(response.getStudent()).isNotNull();
        assertThat(response.getMentor()).isNotNull();
    }

    @Test
    @DisplayName("UTCID02 - Caller is not a participant -> getTaskReport -> ForbiddenException")
    void utcid02_getTaskReport_forbidden() {
        // Given
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentoringGroupService.isActiveMember(task.getRequest(), OTHER_USER_ID)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> taskService.getTaskReport(OTHER_USER_ID, TASK_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
    }

    @Test
    @DisplayName("UTCID03 - Task id 99 does not exist -> getTaskReport -> ResourceNotFoundException")
    void utcid03_getTaskReport_notFound() {
        // Given
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> taskService.getTaskReport(STUDENT_USER_ID, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy Mentoring Task với ID: 99");
    }

    // ================= UTCID04 -> UTCID11: submitMentorReview =================

    @Test
    @DisplayName("UTCID04 - Student; task COMPLETED -> submitMentorReview(rating=5) -> Review saved; reputation +10")
    void utcid04_submitMentorReview_ok() {
        // Given
        MentorReviewRequest request = MentorReviewRequest.builder()
                .taskId(TASK_ID)
                .rating(5)
                .comment("Mentor nhiệt tình, chuyên môn rất sâu!")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentorReviewRepository.existsByTaskId(TASK_ID)).thenReturn(false);
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorReviewRepository.save(any(MentorReview.class))).thenAnswer(i -> {
            MentorReview r = i.getArgument(0);
            r.setId(1L);
            r.setCreatedAt(Instant.now());
            return r;
        });

        // When
        MentorReviewResponse response = reputationService.submitMentorReview(STUDENT_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPointsAwarded()).isEqualTo(10);
        assertThat(mentorProfile.getReputationScore()).isEqualTo(110);
        verify(mentorReviewRepository).save(any(MentorReview.class));
        verify(mentorProfileRepository).save(mentorProfile);
    }

    @Test
    @DisplayName("UTCID05 - Student; task COMPLETED -> submitMentorReview(rating=3) -> Review saved; reputation +0")
    void utcid05_submitMentorReview_ok() {
        // Given
        MentorReviewRequest request = MentorReviewRequest.builder()
                .taskId(TASK_ID)
                .rating(3)
                .comment("Mentor hỗ trợ mức độ trung bình")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentorReviewRepository.existsByTaskId(TASK_ID)).thenReturn(false);
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorReviewRepository.save(any(MentorReview.class))).thenAnswer(i -> {
            MentorReview r = i.getArgument(0);
            r.setId(1L);
            r.setCreatedAt(Instant.now());
            return r;
        });

        // When
        MentorReviewResponse response = reputationService.submitMentorReview(STUDENT_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPointsAwarded()).isEqualTo(0);
        assertThat(mentorProfile.getReputationScore()).isEqualTo(100);
    }

    @Test
    @DisplayName("UTCID06 - Student; task COMPLETED -> submitMentorReview(rating=1) -> Review saved; reputation -25")
    void utcid06_submitMentorReview_ok() {
        // Given
        MentorReviewRequest request = MentorReviewRequest.builder()
                .taskId(TASK_ID)
                .rating(1)
                .comment("Mentor không hỗ trợ nhiệt tình")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentorReviewRepository.existsByTaskId(TASK_ID)).thenReturn(false);
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorReviewRepository.save(any(MentorReview.class))).thenAnswer(i -> {
            MentorReview r = i.getArgument(0);
            r.setId(1L);
            r.setCreatedAt(Instant.now());
            return r;
        });

        // When
        MentorReviewResponse response = reputationService.submitMentorReview(STUDENT_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPointsAwarded()).isEqualTo(-25);
        assertThat(mentorProfile.getReputationScore()).isEqualTo(75);
    }

    @Test
    @DisplayName("UTCID07 - rating = 1 and rating = 5 -> Boundary values -> Accepted")
    void utcid07_submitMentorReview_ok() {
        // Given: Validate boundary rating 1 and 5
        MentorReviewRequest reqMin = MentorReviewRequest.builder().taskId(TASK_ID).rating(1).build();
        MentorReviewRequest reqMax = MentorReviewRequest.builder().taskId(TASK_ID).rating(5).build();

        // When
        Set<ConstraintViolation<MentorReviewRequest>> minViolations = validator.validate(reqMin);
        Set<ConstraintViolation<MentorReviewRequest>> maxViolations = validator.validate(reqMax);

        // Then
        assertThat(minViolations).isEmpty();
        assertThat(maxViolations).isEmpty();
    }

    @Test
    @DisplayName("UTCID08 - rating = 0 / 6 -> Validation error")
    void utcid08_submitMentorReview_invalid() {
        // Given: rating 0 (< 1) and rating 6 (> 5)
        MentorReviewRequest reqZero = MentorReviewRequest.builder().taskId(TASK_ID).rating(0).build();
        MentorReviewRequest reqSix = MentorReviewRequest.builder().taskId(TASK_ID).rating(6).build();

        // When
        Set<ConstraintViolation<MentorReviewRequest>> zeroViolations = validator.validate(reqZero);
        Set<ConstraintViolation<MentorReviewRequest>> sixViolations = validator.validate(reqSix);

        // Then
        assertThat(zeroViolations).anyMatch(v -> v.getMessage().contains("Số sao tối thiểu là 1"));
        assertThat(sixViolations).anyMatch(v -> v.getMessage().contains("Số sao tối đa là 5"));
    }

    @Test
    @DisplayName("UTCID09 - Consecutive high ratings -> submitMentorReview(rating=5) -> Streak bonus added (+20)")
    void utcid09_submitMentorReview_ok() {
        // Given: 4 prior reviews with >= 4 stars
        MentorReview r1 = MentorReview.builder().rating(5).build();
        MentorReview r2 = MentorReview.builder().rating(4).build();
        MentorReview r3 = MentorReview.builder().rating(5).build();
        MentorReview r4 = MentorReview.builder().rating(5).build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentorReviewRepository.existsByTaskId(TASK_ID)).thenReturn(false);
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));
        when(mentorReviewRepository.findTop5ByMentorProfileIdOrderByCreatedAtDesc(MENTOR_PROFILE_ID))
                .thenReturn(List.of(r1, r2, r3, r4));
        when(mentorReviewRepository.save(any(MentorReview.class))).thenAnswer(i -> {
            MentorReview r = i.getArgument(0);
            r.setId(1L);
            r.setCreatedAt(Instant.now());
            return r;
        });

        MentorReviewRequest request = MentorReviewRequest.builder().taskId(TASK_ID).rating(5).build();

        // When
        MentorReviewResponse response = reputationService.submitMentorReview(STUDENT_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        // +10 points from 5 stars + 20 points streak bonus = +30 points total
        assertThat(response.getPointsAwarded()).isEqualTo(30);
        assertThat(mentorProfile.getReputationScore()).isEqualTo(130);
    }

    @Test
    @DisplayName("UTCID10 - Task already reviewed -> submitMentorReview -> ConflictException")
    void utcid10_submitMentorReview_conflict() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentorReviewRepository.existsByTaskId(TASK_ID)).thenReturn(true);

        MentorReviewRequest request = MentorReviewRequest.builder().taskId(TASK_ID).rating(5).build();

        // When + Then
        assertThatThrownBy(() -> reputationService.submitMentorReview(STUDENT_EMAIL, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã đánh giá Mentor cho Task này rồi.");
    }

    @Test
    @DisplayName("UTCID11 - Task not COMPLETED -> submitMentorReview -> BadRequestException")
    void utcid11_submitMentorReview_badRequest() {
        // Given: Task IN_PROGRESS
        task.setStatus(MentoringTaskStatus.IN_PROGRESS);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        MentorReviewRequest request = MentorReviewRequest.builder().taskId(TASK_ID).rating(5).build();

        // When + Then
        assertThatThrownBy(() -> reputationService.submitMentorReview(STUDENT_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ có thể đánh giá Mentor sau khi Task đã hoàn thành.");
    }

    // ================= UTCID12 -> UTCID13: Penalty and Completed Task =================

    @Test
    @DisplayName("UTCID12 - Mentor profile exists -> applyPenalty -> Reputation score decreased by 50")
    void utcid12_applyPenalty_ok() {
        // Given
        when(mentorProfileRepository.findById(MENTOR_PROFILE_ID)).thenReturn(Optional.of(mentorProfile));

        // When
        reputationService.applyPenalty(MENTOR_PROFILE_ID, "Hủy hẹn nhiều lần không báo trước");

        // Then
        assertThat(mentorProfile.getReputationScore()).isEqualTo(50);
        verify(mentorProfileRepository).save(mentorProfile);
    }

    @Test
    @DisplayName("UTCID13 - Mentor profile exists -> recordTaskCompleted -> Completed-task count +1")
    void utcid13_recordTaskCompleted_ok() {
        // Given
        when(mentorProfileRepository.findByUserId(MENTOR_USER_ID)).thenReturn(Optional.of(mentorProfile));

        // When
        reputationService.recordTaskCompleted(mentorUser);

        // Then
        assertThat(mentorProfile.getCompletedTasks()).isEqualTo(6);
        verify(mentorProfileRepository).save(mentorProfile);
    }
}
