package com.alumnect.alumnect_backend.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.WorkLogAttachmentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskServiceImpl;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWorkLogServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử nghiệp vụ UC106 (Xem & quản lý Mentoring Task) và UC107 (Cập nhật Work Log).
 */
@ExtendWith(MockitoExtension.class)
class MentoringTaskAndWorkLogServiceTest {

    @Mock private MentoringTaskRepository taskRepository;
    @Mock private MentoringTaskPaymentRepository paymentRepository;
    @Mock private MentoringWorkLogRepository workLogRepository;
    @Mock private com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogFeedbackRepository feedbackRepository;
    @Mock private com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRevisionRepository revisionRepository;
    @Mock private MentoringTaskMapper taskMapper;
    @Mock private MentoringWorkLogMapper workLogMapper;
    @Mock private NotificationService notificationService;

    private MentoringWorkLogServiceImpl workLogService;
    private MentoringTaskServiceImpl taskService;

    private User student;
    private User mentor;
    private User otherUser;
    private MentoringDeal deal;
    private MentoringTask task;

    @BeforeEach
    void setUp() {
        workLogService = new MentoringWorkLogServiceImpl(
                taskRepository,
                workLogRepository,
                feedbackRepository,
                revisionRepository,
                workLogMapper,
                notificationService
        );

        taskService = new MentoringTaskServiceImpl(
                taskRepository,
                paymentRepository,
                workLogRepository,
                taskMapper,
                workLogService
        );

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role alumniRole = Role.builder().id(2L).name("ALUMNI").build();

        student = User.builder()
                .id(101L)
                .email("student@fpt.edu.vn")
                .role(studentRole)
                .profile(UserProfile.builder().fullName("Nguyễn Văn Học Viên").build())
                .build();

        mentor = User.builder()
                .id(202L)
                .email("mentor@fpt.edu.vn")
                .role(alumniRole)
                .profile(UserProfile.builder().fullName("Trần Văn Mentor").build())
                .build();

        otherUser = User.builder()
                .id(999L)
                .email("stranger@fpt.edu.vn")
                .role(studentRole)
                .profile(UserProfile.builder().fullName("Người Lạ").build())
                .build();

        deal = MentoringDeal.builder()
                .id(501L)
                .student(student)
                .mentor(mentor)
                .taskScope("Hướng dẫn đồ án tốt nghiệp Capstone Project")
                .agreedPrice(new BigDecimal("2500000"))
                .deadline(Instant.now().plusSeconds(864000))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.CAPSTONE_ADVICE)
                .expectedResult("Hoàn thành kiến trúc Microservices")
                .version(1)
                .isPaid(true)
                .paidAt(Instant.now())
                .build();

        task = MentoringTask.builder()
                .id(301L)
                .deal(deal)
                .student(student)
                .mentor(mentor)
                .taskTitle("Hướng dẫn đồ án tốt nghiệp Capstone Project")
                .taskScope(deal.getTaskScope())
                .agreedPrice(deal.getAgreedPrice())
                .deadline(deal.getDeadline())
                .workingMode(deal.getWorkingMode())
                .participationType(deal.getParticipationType())
                .taskType(deal.getTaskType())
                .expectedResult(deal.getExpectedResult())
                .status(MentoringTaskStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .workLogs(new ArrayList<>())
                .build();
    }

    // =========================================================================
    // UC106 TESTS: XEM & QUẢN LÝ MENTORING TASK
    // =========================================================================

    @Test
    @DisplayName("TC106-01: Student lấy danh sách Task của mình thành công")
    void testStudentGetMyTasks_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        when(taskRepository.findByParticipant(eq(student.getId()), any()))
                .thenReturn(new PageImpl<>(List.of(task), pageable, 1));
        when(taskMapper.toTaskResponse(task)).thenReturn(MentoringTaskResponse.builder().id(task.getId()).build());

        PageResponse<MentoringTaskResponse> result = taskService.getMyTasks(student.getId(), null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(task.getId());
        assertThat(result.getContent().get(0).getUiStage()).isEqualTo("IN_PROGRESS");
    }

    @Test
    @DisplayName("TC106-02: Mentor lấy danh sách Task của mình thành công")
    void testMentorGetMyTasks_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        when(taskRepository.findByParticipant(eq(mentor.getId()), any()))
                .thenReturn(new PageImpl<>(List.of(task), pageable, 1));
        when(taskMapper.toTaskResponse(task)).thenReturn(MentoringTaskResponse.builder().id(task.getId()).build());

        PageResponse<MentoringTaskResponse> result = taskService.getMyTasks(mentor.getId(), null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(task.getId());
    }

    @Test
    @DisplayName("TC106-03 & TC106-04: Người dùng không thuộc Task không nhìn thấy Task người khác")
    void testOtherUserGetMyTasks_EmptyForStranger() {
        Pageable pageable = PageRequest.of(0, 10);
        when(taskRepository.findByParticipant(eq(otherUser.getId()), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));

        PageResponse<MentoringTaskResponse> result = taskService.getMyTasks(otherUser.getId(), null, null, pageable);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("TC106-05: Student mở Task Detail của mình thành công")
    void testStudentOpenTaskDetail_Success() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())).thenReturn(Collections.emptyList());

        MentoringTaskDetailResponse response = taskService.getTaskDetail(student.getId(), task.getId());

        assertThat(response.getOverview().getId()).isEqualTo(task.getId());
        assertThat(response.getOverview().getUiStage()).isEqualTo("IN_PROGRESS");
        assertThat(response.getPermissions().getIsStudent()).isTrue();
        assertThat(response.getPermissions().getIsMentor()).isFalse();
        assertThat(response.getPermissions().getCanAddWorkLog()).isFalse();
    }

    @Test
    @DisplayName("TC106-06: Mentor mở Task Detail của mình thành công")
    void testMentorOpenTaskDetail_Success() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())).thenReturn(Collections.emptyList());

        MentoringTaskDetailResponse response = taskService.getTaskDetail(mentor.getId(), task.getId());

        assertThat(response.getOverview().getId()).isEqualTo(task.getId());
        assertThat(response.getPermissions().getIsMentor()).isTrue();
        assertThat(response.getPermissions().getCanAddWorkLog()).isTrue();
    }

    @Test
    @DisplayName("TC106-07: Unauthorized participant truy cập Task Detail -> 403 Forbidden")
    void testUnauthorizedAccessTaskDetail_Forbidden() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> taskService.getTaskDetail(otherUser.getId(), task.getId()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bạn không có quyền truy cập");
    }

    @Test
    @DisplayName("TC106-08: Completed Task trả về read-only state phù hợp")
    void testCompletedTask_ReadOnlyState() {
        task.setStatus(MentoringTaskStatus.COMPLETED);
        task.setCompletedAt(Instant.now());
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())).thenReturn(Collections.emptyList());

        MentoringTaskDetailResponse response = taskService.getTaskDetail(mentor.getId(), task.getId());

        assertThat(response.getOverview().getUiStage()).isEqualTo("ENDING");
        assertThat(response.getOverview().getStatus()).isEqualTo(MentoringTaskStatus.COMPLETED);
        assertThat(response.getOverview().getProgressPercentage()).isEqualTo(100);
        assertThat(response.getPermissions().getIsReadOnly()).isTrue();
        assertThat(response.getPermissions().getCanAddWorkLog()).isFalse();
    }

    @Test
    @DisplayName("TC106-09: Disputed Task trả về trạng thái DISPUTED và khóa mutation")
    void testDisputedTask_State() {
        task.setStatus(MentoringTaskStatus.DISPUTED);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())).thenReturn(Collections.emptyList());

        MentoringTaskDetailResponse response = taskService.getTaskDetail(mentor.getId(), task.getId());

        assertThat(response.getOverview().getStatus()).isEqualTo(MentoringTaskStatus.DISPUTED);
        assertThat(response.getPermissions().getIsDisputed()).isTrue();
        assertThat(response.getPermissions().getCanAddWorkLog()).isFalse();
    }

    @Test
    @DisplayName("TC106-10: Task Detail trả đúng liên kết Task -> Deal -> Payment -> Participants")
    void testTaskDetail_RelationshipTraceability() {
        MentoringTaskPayment payment = MentoringTaskPayment.builder()
                .id(901L)
                .orderCode(123456789L)
                .amount(deal.getAgreedPrice())
                .paymentStatus(PaymentStatus.PAID)
                .paymentMethod("PAYOS")
                .paidAt(Instant.now())
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(paymentRepository.findFirstByDealIdAndPaymentStatus(deal.getId(), PaymentStatus.PAID))
                .thenReturn(Optional.of(payment));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())).thenReturn(Collections.emptyList());

        MentoringTaskDetailResponse response = taskService.getTaskDetail(student.getId(), task.getId());

        assertThat(response.getDeal()).isNotNull();
        assertThat(response.getDeal().getId()).isEqualTo(deal.getId());
        assertThat(response.getDeal().getAgreedPrice()).isEqualByComparingTo(deal.getAgreedPrice());
        assertThat(response.getPayment()).isNotNull();
        assertThat(response.getPayment().getPaymentId()).isEqualTo(901L);
        assertThat(response.getPayment().getOrderCode()).isEqualTo(123456789L);
        assertThat(response.getStudent().getId()).isEqualTo(student.getId());
        assertThat(response.getMentor().getId()).isEqualTo(mentor.getId());
    }

    // =========================================================================
    // UC107 TESTS: CẬP NHẬT WORK LOG
    // =========================================================================

    @Test
    @DisplayName("TC107-01 & TC107-02: Mentor tạo Work Log hợp lệ -> success và status là PENDING_CONFIRMATION")
    void testMentorCreateWorkLog_Success() {
        CreateMentoringWorkLogRequest req = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Thiết kế sơ đồ kiến trúc và ERD cho Capstone")
                .workCompleted("Hoàn thành sơ đồ Class Diagram và Sequence Diagram")
                .result("Học viên nắm vững cấu trúc module Payment")
                .nextAction("Chuẩn bị code Controller và Repository")
                .attachments(List.of(WorkLogAttachmentRequest.builder()
                        .fileUrl("https://storage.alumnect.vn/work_logs/architecture.pdf")
                        .fileName("architecture.pdf")
                        .fileSize(1024L)
                        .mediaType(MediaType.FILE)
                        .build()))
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(inv -> {
            MentoringWorkLog log = inv.getArgument(0);
            log.setId(701L);
            return log;
        });
        when(workLogMapper.toWorkLogResponse(any(MentoringWorkLog.class))).thenAnswer(inv -> {
            MentoringWorkLog l = inv.getArgument(0);
            return MentoringWorkLogResponse.builder()
                    .id(l.getId())
                    .taskId(task.getId())
                    .status(l.getStatus())
                    .logDate(l.getLogDate())
                    .build();
        });

        MentoringWorkLogResponse res = workLogService.createWorkLog(mentor.getId(), task.getId(), req);

        assertThat(res.getId()).isEqualTo(701L);
        assertThat(res.getStatus()).isEqualTo(WorkLogStatus.PENDING_CONFIRMATION);

        // TC107-12: Verify notification được gửi tới đúng Student của Task
        verify(notificationService, times(1)).sendMentoringWorkLogNotification(
                eq(mentor), eq(student), eq(task), any(MentoringWorkLog.class));
    }

    @Test
    @DisplayName("TC107-03: Student không thể tạo Work Log -> 403 Forbidden")
    void testStudentCannotCreateWorkLog_Forbidden() {
        CreateMentoringWorkLogRequest req = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Học viên tự viết log")
                .workCompleted("Làm bài tập")
                .result("Hoàn thành")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.createWorkLog(student.getId(), task.getId(), req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Học viên không có quyền tạo nhật ký công việc");
    }

    @Test
    @DisplayName("TC107-04: Mentor khác không thể tạo Work Log -> 403 Forbidden")
    void testOtherMentorCannotCreateWorkLog_Forbidden() {
        CreateMentoringWorkLogRequest req = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Mentor lạ viết log")
                .workCompleted("Làm việc")
                .result("Xong")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.createWorkLog(otherUser.getId(), task.getId(), req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bạn không phải là Mentor phụ trách");
    }

    @Test
    @DisplayName("TC107-06: Mentor edit Work Log chưa confirm -> success")
    void testMentorEditUnconfirmedWorkLog_Success() {
        MentoringWorkLog existingLog = MentoringWorkLog.builder()
                .id(801L)
                .task(task)
                .mentor(mentor)
                .logDate(LocalDate.now().minusDays(1))
                .description("Mô tả ban đầu")
                .workCompleted("Công việc ban đầu")
                .result("Kết quả ban đầu")
                .status(WorkLogStatus.PENDING_CONFIRMATION)
                .attachments(new ArrayList<>())
                .build();

        UpdateMentoringWorkLogRequest updateReq = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now().minusDays(1))
                .description("Mô tả đã được cập nhật chi tiết hơn")
                .workCompleted("Bổ sung thêm 2 test cases")
                .result("Kết quả hoàn thiện 100%")
                .nextAction("Chờ nghiệm thu")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(801L, task.getId())).thenReturn(Optional.of(existingLog));
        when(workLogRepository.save(existingLog)).thenReturn(existingLog);
        when(workLogMapper.toWorkLogResponse(existingLog)).thenReturn(MentoringWorkLogResponse.builder()
                .id(801L)
                .description(updateReq.getDescription())
                .status(WorkLogStatus.PENDING_CONFIRMATION)
                .build());

        MentoringWorkLogResponse res = workLogService.updateWorkLog(mentor.getId(), task.getId(), 801L, updateReq);

        assertThat(res.getId()).isEqualTo(801L);
        assertThat(existingLog.getDescription()).isEqualTo("Mô tả đã được cập nhật chi tiết hơn");
    }

    @Test
    @DisplayName("TC107-07: Mentor không thể edit Work Log đã confirmed -> 409 Conflict")
    void testMentorCannotEditConfirmedWorkLog_Conflict() {
        MentoringWorkLog confirmedLog = MentoringWorkLog.builder()
                .id(802L)
                .task(task)
                .mentor(mentor)
                .logDate(LocalDate.now().minusDays(2))
                .description("Đã nghiệm thu")
                .workCompleted("Đã nghiệm thu")
                .result("Hoàn thành")
                .status(WorkLogStatus.CONFIRMED)
                .confirmedAt(Instant.now())
                .build();

        UpdateMentoringWorkLogRequest updateReq = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now().minusDays(2))
                .description("Cố tình sửa sau khi học viên đã confirm")
                .workCompleted("Đổi nội dung")
                .result("Đổi kết quả")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(802L, task.getId())).thenReturn(Optional.of(confirmedLog));

        assertThatThrownBy(() -> workLogService.updateWorkLog(mentor.getId(), task.getId(), 802L, updateReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Không thể chỉnh sửa nhật ký công việc đã được học viên xác nhận");
    }

    @Test
    @DisplayName("TC107-08: Mentor không thể edit Work Log thuộc Task khác")
    void testCannotEditWorkLogOfDifferentTask_NotFound() {
        UpdateMentoringWorkLogRequest updateReq = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Sửa log khác task")
                .workCompleted("Nội dung")
                .result("Kết quả")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(999L, task.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workLogService.updateWorkLog(mentor.getId(), task.getId(), 999L, updateReq))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhật ký công việc ID: 999");
    }

    @Test
    @DisplayName("TC107-09: Không thể Add Work Log vào completed Task -> 409 Conflict")
    void testCannotAddWorkLogToCompletedTask() {
        task.setStatus(MentoringTaskStatus.COMPLETED);
        CreateMentoringWorkLogRequest req = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Nộp thêm sau khi xong")
                .workCompleted("Xong rồi")
                .result("Đã xong")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.createWorkLog(mentor.getId(), task.getId(), req))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Mentoring Task đã hoàn thành");
    }

    @Test
    @DisplayName("TC107-10: Không thể Add Work Log vào cancelled Task -> 409 Conflict")
    void testCannotAddWorkLogToCancelledTask() {
        task.setStatus(MentoringTaskStatus.CANCELLED);
        CreateMentoringWorkLogRequest req = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Nộp vào task bị hủy")
                .workCompleted("Đã hủy")
                .result("Hủy")
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.createWorkLog(mentor.getId(), task.getId(), req))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Mentoring Task đã bị hủy bỏ");
    }

    @Test
    @DisplayName("TC107-11: Attachment được link đúng Work Log")
    void testAttachmentLinkedToWorkLog() {
        CreateMentoringWorkLogRequest req = CreateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Nộp sản phẩm đính kèm")
                .workCompleted("Đã viết tài liệu SRS")
                .result("Tài liệu SRS hoàn chỉnh")
                .attachments(List.of(
                        WorkLogAttachmentRequest.builder()
                                .fileUrl("https://r2.alumnect.vn/srs_report.pdf")
                                .fileName("srs_report.pdf")
                                .fileSize(2048000L)
                                .mediaType(MediaType.FILE)
                                .build(),
                        WorkLogAttachmentRequest.builder()
                                .fileUrl("https://r2.alumnect.vn/screenshot.png")
                                .fileName("screenshot.png")
                                .fileSize(512000L)
                                .mediaType(MediaType.IMAGE)
                                .build()
                ))
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        ArgumentCaptor<MentoringWorkLog> captor = ArgumentCaptor.forClass(MentoringWorkLog.class);
        when(workLogRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any())).thenReturn(MentoringWorkLogResponse.builder().id(1L).build());

        workLogService.createWorkLog(mentor.getId(), task.getId(), req);

        MentoringWorkLog saved = captor.getValue();
        assertThat(saved.getAttachments()).hasSize(2);
        assertThat(saved.getAttachments().get(0).getFileUrl()).isEqualTo("https://r2.alumnect.vn/srs_report.pdf");
        assertThat(saved.getAttachments().get(0).getWorkLog()).isEqualTo(saved);
        assertThat(saved.getAttachments().get(1).getMediaType()).isEqualTo(MediaType.IMAGE);
    }

    @Test
    @DisplayName("TC107-14: Work Log xuất hiện trong Task History của Task Detail")
    void testWorkLogAppearsInTaskHistory() {
        MentoringWorkLog log1 = MentoringWorkLog.builder()
                .id(901L)
                .task(task)
                .mentor(mentor)
                .logDate(LocalDate.now().minusDays(3))
                .description("Buổi trao đổi 1")
                .workCompleted("Thống nhất spec")
                .result("Hoàn thành spec")
                .status(WorkLogStatus.CONFIRMED)
                .confirmedAt(Instant.now().minusSeconds(100000))
                .createdAt(Instant.now().minusSeconds(200000))
                .updatedAt(Instant.now().minusSeconds(200000))
                .attachments(new ArrayList<>())
                .build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())).thenReturn(List.of(log1));
        when(workLogMapper.toWorkLogResponse(log1)).thenReturn(MentoringWorkLogResponse.builder()
                .id(901L)
                .logDate(log1.getLogDate())
                .description(log1.getDescription())
                .status(WorkLogStatus.CONFIRMED)
                .confirmedAt(log1.getConfirmedAt())
                .createdAt(log1.getCreatedAt())
                .updatedAt(log1.getUpdatedAt())
                .mentorName("Trần Văn Mentor")
                .build());

        MentoringTaskDetailResponse detail = taskService.getTaskDetail(student.getId(), task.getId());

        assertThat(detail.getHistory()).isNotEmpty();
        boolean hasWorkLogSubmitted = detail.getHistory().stream()
                .anyMatch(h -> "WORK_LOG_SUBMITTED".equals(h.getEventType()) && h.getTitle().contains(log1.getLogDate().toString()));
        boolean hasWorkLogConfirmed = detail.getHistory().stream()
                .anyMatch(h -> "WORK_LOG_CONFIRMED".equals(h.getEventType()));
        assertThat(hasWorkLogSubmitted).isTrue();
        assertThat(hasWorkLogConfirmed).isTrue();
    }
}
