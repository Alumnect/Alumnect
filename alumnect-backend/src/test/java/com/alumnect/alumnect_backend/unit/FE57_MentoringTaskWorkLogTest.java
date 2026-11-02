package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogFeedbackRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRevisionRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ConfirmMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RejectMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringGroupService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRules;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskCompletionService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskResolutionService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTicketService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWorkLogService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWorkLogServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.RefundAccountResolver;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit Test Suite cho FE-57: Mentoring - Manage Tasks & Work Logs
 * Tổng cộng 16 Test Cases (UTCID01 -> UTCID16).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-57 Mentoring - Manage Tasks & Work Logs")
class FE57_MentoringTaskWorkLogTest {

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
    private MentoringWorkLogService taskWorkLogService;

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
    private MentoringWorkLogFeedbackRepository feedbackRepository;

    @Mock
    private MentoringWorkLogRevisionRepository revisionRepository;

    @Mock
    private MentoringWorkLogMapper workLogMapper;

    @Mock
    private NotificationService notificationService;

    private MentoringTaskServiceImpl taskService;
    private MentoringWorkLogServiceImpl workLogService;

    private static final Long STUDENT_USER_ID = 1L;
    private static final Long MENTOR_USER_ID = 2L;
    private static final Long OTHER_USER_ID = 99L;
    private static final Long TASK_ID = 100L;
    private static final Long WORK_LOG_ID = 500L;

    private User studentUser;
    private User mentorUser;
    private MentoringRequest mentoringRequest;
    private MentoringDeal deal;
    private MentoringTask task;
    private MentoringWorkLog workLog;
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
                taskWorkLogService,
                resolutionService,
                completionService,
                ticketService,
                mentoringGroupService,
                refundAccountResolver,
                mentoringRules
        );

        workLogService = new MentoringWorkLogServiceImpl(
                mentoringGroupService,
                taskRepository,
                workLogRepository,
                feedbackRepository,
                revisionRepository,
                workLogMapper,
                notificationService
        );

        validator = Validation.buildDefaultValidatorFactory().getValidator();

        studentUser = User.builder().id(STUDENT_USER_ID).email("student@fpt.edu.vn").build();
        mentorUser = User.builder().id(MENTOR_USER_ID).email("mentor@fpt.edu.vn").build();

        mentoringRequest = MentoringRequest.builder()
                .id(200L)
                .student(studentUser)
                .title("Hướng dẫn đồ án")
                .build();

        deal = MentoringDeal.builder()
                .id(300L)
                .student(studentUser)
                .mentor(mentorUser)
                .isPaid(true)
                .agreedPrice(BigDecimal.valueOf(500000))
                .build();

        task = MentoringTask.builder()
                .id(TASK_ID)
                .student(studentUser)
                .mentor(mentorUser)
                .deal(deal)
                .request(mentoringRequest)
                .taskTitle("Hoàn thiện hệ thống Backend")
                .status(MentoringTaskStatus.PREPARATION)
                .agreedPrice(BigDecimal.valueOf(500000))
                .createdAt(Instant.now())
                .build();

        workLog = MentoringWorkLog.builder()
                .id(WORK_LOG_ID)
                .task(task)
                .mentor(mentorUser)
                .logDate(LocalDate.now())
                .description("Thiết kế database schema")
                .workCompleted("Tạo các bảng User, Task, WorkLog")
                .result("Hoàn thành DDL và script migration")
                .nextAction("Viết Repository và Service")
                .status(WorkLogStatus.PENDING_CONFIRMATION)
                .revisionNumber(1)
                .attachments(new ArrayList<>())
                .build();
    }

    // ================= UTCID01 -> UTCID02: MentoringTaskService =================

    @Test
    @DisplayName("UTCID01 - User has 3 tasks -> getMyTasks -> Page of tasks with progress returned")
    void utcid01_getMyTasks_ok() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        MentoringTask task1 = MentoringTask.builder().id(101L).student(studentUser).mentor(mentorUser).status(MentoringTaskStatus.IN_PROGRESS).deal(deal).build();
        MentoringTask task2 = MentoringTask.builder().id(102L).student(studentUser).mentor(mentorUser).status(MentoringTaskStatus.PREPARATION).deal(deal).build();
        MentoringTask task3 = MentoringTask.builder().id(103L).student(studentUser).mentor(mentorUser).status(MentoringTaskStatus.COMPLETED).deal(deal).build();

        Page<MentoringTask> taskPage = new PageImpl<>(List.of(task1, task2, task3), pageable, 3);
        when(taskRepository.findByParticipant(STUDENT_USER_ID, pageable)).thenReturn(taskPage);
        when(taskMapper.toTaskResponse(any(MentoringTask.class))).thenReturn(new MentoringTaskResponse());

        // When
        PageResponse<MentoringTaskResponse> response = taskService.getMyTasks(STUDENT_USER_ID, "ALL", null, pageable);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(3);
        assertThat(response.getTotalElements()).isEqualTo(3);
    }

    @Test
    @DisplayName("UTCID02 - User is not a participant -> getTaskDetail -> ForbiddenException")
    void utcid02_getTaskDetail_forbidden() {
        // Given
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(mentoringGroupService.isActiveMember(task.getRequest(), OTHER_USER_ID)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> taskService.getTaskDetail(OTHER_USER_ID, TASK_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
    }

    // ================= UTCID03 -> UTCID08: createWorkLog =================

    @Test
    @DisplayName("UTCID03 - Caller is task mentor; task PREPARATION -> createWorkLog -> Work log saved; task becomes IN_PROGRESS")
    void utcid03_createWorkLog_ok() {
        // Given
        CreateMentoringWorkLogRequest request = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Buổi họp kickoff dự án và phân chia công việc")
                .workCompleted("Thống nhất sơ đồ tuần tự và kiến trúc tổng thể")
                .result("Hoàn tất tài liệu đặc tả API v1")
                .nextAction("Cài đặt môi trường CI/CD")
                .attachments(Collections.emptyList())
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenReturn(workLog);
        when(workLogMapper.toWorkLogResponse(any(MentoringWorkLog.class))).thenReturn(new MentoringWorkLogResponse());

        // When
        MentoringWorkLogResponse response = workLogService.createWorkLog(MENTOR_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.IN_PROGRESS);
        verify(taskRepository).save(task);
        verify(workLogRepository).save(any(MentoringWorkLog.class));
    }

    @Test
    @DisplayName("UTCID04 - Task IN_PROGRESS -> description / result with 5 and 5000 characters -> Work log saved")
    void utcid04_createWorkLog_ok() {
        // Given: Boundary lengths (min 5 chars, max 5000 chars)
        String minDesc = "12345";
        String maxResult = "A".repeat(5000);

        CreateMentoringWorkLogRequest request = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description(minDesc)
                .workCompleted("Nội dung hoàn thành hợp lệ")
                .result(maxResult)
                .attachments(Collections.emptyList())
                .build();

        task.setStatus(MentoringTaskStatus.IN_PROGRESS);
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenReturn(workLog);
        when(workLogMapper.toWorkLogResponse(any(MentoringWorkLog.class))).thenReturn(new MentoringWorkLogResponse());

        // When
        MentoringWorkLogResponse response = workLogService.createWorkLog(MENTOR_USER_ID, TASK_ID, request);

        // Then
        assertThat(response).isNotNull();
        verify(workLogRepository).save(any(MentoringWorkLog.class));
    }

    @Test
    @DisplayName("UTCID05 - Task IN_PROGRESS -> description with 4 characters -> Validation error")
    void utcid05_createWorkLog_invalid() {
        // Given: 4 characters (< 5)
        CreateMentoringWorkLogRequest request = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("1234")
                .workCompleted("Nội dung hoàn thành hợp lệ")
                .result("Kết quả hợp lệ")
                .build();

        // When
        Set<ConstraintViolation<CreateMentoringWorkLogRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().contains("Mô tả công việc phải từ 5 đến 5000 ký tự."));
    }

    @Test
    @DisplayName("UTCID06 - Task IN_PROGRESS -> nextAction with 2001 characters -> Validation error")
    void utcid06_createWorkLog_invalid() {
        // Given: 2001 characters (> 2000)
        CreateMentoringWorkLogRequest request = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Mô tả công việc hợp lệ")
                .workCompleted("Nội dung hoàn thành hợp lệ")
                .result("Kết quả hợp lệ")
                .nextAction("X".repeat(2001))
                .build();

        // When
        Set<ConstraintViolation<CreateMentoringWorkLogRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().contains("Hành động tiếp theo không vượt quá 2000 ký tự."));
    }

    @Test
    @DisplayName("UTCID07 - Caller is the student -> createWorkLog -> ForbiddenException")
    void utcid07_createWorkLog_forbidden() {
        // Given
        CreateMentoringWorkLogRequest request = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Học viên cố tình tạo work log")
                .workCompleted("Không hợp lệ")
                .result("Không hợp lệ")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        // When + Then
        assertThatThrownBy(() -> workLogService.createWorkLog(STUDENT_USER_ID, TASK_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Học viên không có quyền tạo nhật ký công việc (chỉ Mentor phụ trách mới có quyền).");
    }

    @Test
    @DisplayName("UTCID08 - Task COMPLETED / CANCELLED / DISPUTED -> createWorkLog -> ConflictException")
    void utcid08_createWorkLog_conflict() {
        // Given: Task is COMPLETED
        task.setStatus(MentoringTaskStatus.COMPLETED);
        CreateMentoringWorkLogRequest request = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Mô tả hợp lệ")
                .workCompleted("Nội dung hợp lệ")
                .result("Kết quả hợp lệ")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        // When + Then
        assertThatThrownBy(() -> workLogService.createWorkLog(MENTOR_USER_ID, TASK_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Mentoring Task đã hoàn thành, không thể thêm nhật ký công việc mới.");
    }

    // ================= UTCID09 -> UTCID10: updateWorkLog =================

    @Test
    @DisplayName("UTCID09 - Work log not confirmed -> updateWorkLog -> Revision number +1 and snapshot saved")
    void utcid09_updateWorkLog_ok() {
        // Given
        UpdateMentoringWorkLogRequest request = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Mô tả cập nhật đã bổ sung chi tiết")
                .workCompleted("Bổ sung unit tests và tài liệu swagger")
                .result("Pass 100% tests và coverage đạt 85%")
                .nextAction("Chuyển giao cho học viên kiểm thử")
                .attachments(Collections.emptyList())
                .build();

        task.setStatus(MentoringTaskStatus.IN_PROGRESS);
        workLog.setStatus(WorkLogStatus.REJECTED);
        workLog.setRevisionNumber(1);

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(WORK_LOG_ID, TASK_ID)).thenReturn(Optional.of(workLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any(MentoringWorkLog.class))).thenReturn(new MentoringWorkLogResponse());

        // When
        MentoringWorkLogResponse response = workLogService.updateWorkLog(MENTOR_USER_ID, TASK_ID, WORK_LOG_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(workLog.getStatus()).isEqualTo(WorkLogStatus.PENDING_CONFIRMATION);
        assertThat(workLog.getRevisionNumber()).isEqualTo(2);
        verify(revisionRepository).save(any());
        verify(workLogRepository).save(workLog);
    }

    @Test
    @DisplayName("UTCID10 - Work log CONFIRMED -> updateWorkLog -> ConflictException")
    void utcid10_updateWorkLog_conflict() {
        // Given
        UpdateMentoringWorkLogRequest request = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Cố tình sửa log đã confirmed")
                .workCompleted("Nội dung")
                .result("Kết quả")
                .build();

        workLog.setStatus(WorkLogStatus.CONFIRMED);
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(WORK_LOG_ID, TASK_ID)).thenReturn(Optional.of(workLog));

        // When + Then
        assertThatThrownBy(() -> workLogService.updateWorkLog(MENTOR_USER_ID, TASK_ID, WORK_LOG_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Không thể chỉnh sửa nhật ký công việc đã được học viên xác nhận nghiệm thu.");
    }

    // ================= UTCID11 -> UTCID13: confirmWorkLog =================

    @Test
    @DisplayName("UTCID11 - Caller is the student; log submitted -> confirmWorkLog -> Work log CONFIRMED")
    void utcid11_confirmWorkLog_ok() {
        // Given
        ConfirmMentoringWorkLogRequest request = ConfirmMentoringWorkLogRequest.builder()
                .feedback("Nghiệm thu đạt yêu cầu, tiến độ tốt")
                .build();

        task.setStatus(MentoringTaskStatus.IN_PROGRESS);
        workLog.setStatus(WorkLogStatus.PENDING_CONFIRMATION);

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(WORK_LOG_ID, TASK_ID)).thenReturn(Optional.of(workLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any(MentoringWorkLog.class))).thenReturn(new MentoringWorkLogResponse());

        // When
        MentoringWorkLogResponse response = workLogService.confirmWorkLog(STUDENT_USER_ID, TASK_ID, WORK_LOG_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(workLog.getStatus()).isEqualTo(WorkLogStatus.CONFIRMED);
        assertThat(workLog.getStudentFeedback()).isEqualTo("Nghiệm thu đạt yêu cầu, tiến độ tốt");
        verify(feedbackRepository).save(any());
        verify(workLogRepository).save(workLog);
    }

    @Test
    @DisplayName("UTCID12 - Log already CONFIRMED -> confirmWorkLog -> Idempotent: no change")
    void utcid12_confirmWorkLog_ok() {
        // Given
        ConfirmMentoringWorkLogRequest request = ConfirmMentoringWorkLogRequest.builder()
                .feedback("Xác nhận lại")
                .build();

        task.setStatus(MentoringTaskStatus.IN_PROGRESS);
        workLog.setStatus(WorkLogStatus.CONFIRMED);

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(WORK_LOG_ID, TASK_ID)).thenReturn(Optional.of(workLog));
        when(workLogMapper.toWorkLogResponse(workLog)).thenReturn(new MentoringWorkLogResponse());

        // When
        MentoringWorkLogResponse response = workLogService.confirmWorkLog(STUDENT_USER_ID, TASK_ID, WORK_LOG_ID, request);

        // Then
        assertThat(response).isNotNull();
        verify(workLogRepository, never()).save(any(MentoringWorkLog.class));
        verify(feedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - Caller is the mentor -> confirmWorkLog -> ForbiddenException")
    void utcid13_confirmWorkLog_forbidden() {
        // Given
        ConfirmMentoringWorkLogRequest request = ConfirmMentoringWorkLogRequest.builder()
                .feedback("Mentor tự xác nhận")
                .build();

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));

        // When + Then
        assertThatThrownBy(() -> workLogService.confirmWorkLog(MENTOR_USER_ID, TASK_ID, WORK_LOG_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ học viên của Mentoring Task mới có quyền xác nhận nghiệm thu nhật ký công việc.");
    }

    // ================= UTCID14 -> UTCID16: rejectWorkLog =================

    @Test
    @DisplayName("UTCID14 - Log submitted -> rejectWorkLog(reason 'Cần bổ sung') -> Work log marked as needing change")
    void utcid14_rejectWorkLog_ok() {
        // Given
        RejectMentoringWorkLogRequest request = RejectMentoringWorkLogRequest.builder()
                .reason("Cần bổ sung thêm tài liệu API và sơ đồ ERD chi tiết")
                .build();

        task.setStatus(MentoringTaskStatus.IN_PROGRESS);
        workLog.setStatus(WorkLogStatus.PENDING_CONFIRMATION);

        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(WORK_LOG_ID, TASK_ID)).thenReturn(Optional.of(workLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any(MentoringWorkLog.class))).thenReturn(new MentoringWorkLogResponse());

        // When
        MentoringWorkLogResponse response = workLogService.rejectWorkLog(STUDENT_USER_ID, TASK_ID, WORK_LOG_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(workLog.getStatus()).isEqualTo(WorkLogStatus.REJECTED);
        assertThat(workLog.getStudentFeedback()).isEqualTo("Cần bổ sung thêm tài liệu API và sơ đồ ERD chi tiết");
        verify(feedbackRepository).save(any());
        verify(workLogRepository).save(workLog);
    }

    @Test
    @DisplayName("UTCID15 - Log submitted -> rejectWorkLog(reason '') -> BadRequestException")
    void utcid15_rejectWorkLog_badRequest() {
        // Given: Empty reason (< 5 characters)
        RejectMentoringWorkLogRequest request = RejectMentoringWorkLogRequest.builder()
                .reason("")
                .build();

        // When + Then
        assertThatThrownBy(() -> workLogService.rejectWorkLog(STUDENT_USER_ID, TASK_ID, WORK_LOG_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng nhập lý do hoặc nội dung yêu cầu điều chỉnh cho Mentor (tối thiểu 5 ký tự).");
    }

    @Test
    @DisplayName("UTCID16 - Log CONFIRMED -> rejectWorkLog -> ConflictException")
    void utcid16_rejectWorkLog_conflict() {
        // Given
        RejectMentoringWorkLogRequest request = RejectMentoringWorkLogRequest.builder()
                .reason("Muốn từ chối sau khi đã nghiệm thu")
                .build();

        workLog.setStatus(WorkLogStatus.CONFIRMED);
        when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(WORK_LOG_ID, TASK_ID)).thenReturn(Optional.of(workLog));

        // When + Then
        assertThatThrownBy(() -> workLogService.rejectWorkLog(STUDENT_USER_ID, TASK_ID, WORK_LOG_ID, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Nhật ký công việc đã được nghiệm thu thành công, không thể yêu cầu điều chỉnh.");
    }
}
