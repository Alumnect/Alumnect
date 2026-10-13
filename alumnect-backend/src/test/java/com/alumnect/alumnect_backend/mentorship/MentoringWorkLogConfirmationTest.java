package com.alumnect.alumnect_backend.mentorship;

import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dto.request.mentorship.ConfirmMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RejectMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogAttachment;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWorkLogServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
 * Bộ kiểm thử toàn diện cho UC108: Xem & Xác nhận Work Log (View & Confirm Work Log).
 */
@ExtendWith(MockitoExtension.class)
class MentoringWorkLogConfirmationTest {

    @Mock private MentoringTaskRepository taskRepository;
    @Mock private MentoringWorkLogRepository workLogRepository;
    @Mock private MentoringWorkLogFeedbackRepository feedbackRepository;
    @Mock private MentoringWorkLogRevisionRepository revisionRepository;
    @Mock private MentoringWorkLogMapper workLogMapper;
    @Mock private NotificationService notificationService;

    private MentoringWorkLogServiceImpl workLogService;

    private User student;
    private User mentor;
    private User otherStudent;
    private MentoringTask task;
    private MentoringWorkLog pendingLog;
    private MentoringWorkLog confirmedLog;

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

        otherStudent = User.builder()
                .id(999L)
                .email("other@fpt.edu.vn")
                .role(studentRole)
                .profile(UserProfile.builder().fullName("Học viên khác").build())
                .build();

        task = MentoringTask.builder()
                .id(1L)
                .student(student)
                .mentor(mentor)
                .taskTitle("Hướng dẫn đồ án Capstone")
                .taskScope("Xây dựng kiến trúc Backend & Database")
                .agreedPrice(java.math.BigDecimal.valueOf(5000000))
                .status(MentoringTaskStatus.IN_PROGRESS)
                .build();

        pendingLog = MentoringWorkLog.builder()
                .id(10L)
                .task(task)
                .mentor(mentor)
                .logDate(LocalDate.now())
                .description("Thiết kế sơ đồ cơ sở dữ liệu")
                .workCompleted("Hoàn thành ERD và migration V1-V22")
                .result("Tạo thành công 22 bảng dữ liệu và test chạy thành công")
                .nextAction("Cài đặt REST controller và security")
                .status(WorkLogStatus.PENDING_CONFIRMATION)
                .revisionNumber(1)
                .attachments(new ArrayList<>())
                .feedbacks(new ArrayList<>())
                .revisions(new ArrayList<>())
                .build();

        confirmedLog = MentoringWorkLog.builder()
                .id(20L)
                .task(task)
                .mentor(mentor)
                .logDate(LocalDate.now().minusDays(1))
                .description("Phân tích yêu cầu Capstone")
                .workCompleted("Họp trực tuyến 2h và chốt Scope")
                .result("Biên bản phân tích yêu cầu SRS")
                .status(WorkLogStatus.CONFIRMED)
                .confirmedAt(Instant.now().minusSeconds(3600))
                .confirmedBy(student)
                .revisionNumber(1)
                .attachments(new ArrayList<>())
                .feedbacks(new ArrayList<>())
                .revisions(new ArrayList<>())
                .build();
    }

    // =========================================================================
    // TC108-01 -> TC108-05: Viewing Work Logs & Action Eligibility
    // =========================================================================

    @Test
    @DisplayName("TC108-01: Student xem Work Log thuộc Task của mình thành công")
    void testStudentViewWorkLogs_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByTaskIdOrderByLogDateDesc(1L)).thenReturn(List.of(pendingLog));
        when(workLogMapper.toWorkLogResponse(any())).thenReturn(
                MentoringWorkLogResponse.builder().id(10L).status(WorkLogStatus.PENDING_CONFIRMATION).build()
        );

        List<MentoringWorkLogResponse> result = workLogService.getWorkLogsByTaskId(student.getId(), 1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCanConfirm()).isTrue();
        assertThat(result.get(0).getCanReject()).isTrue();
        assertThat(result.get(0).getCanEdit()).isFalse();
    }

    @Test
    @DisplayName("TC108-02: Student xem chi tiết Work Log kèm attachment")
    void testStudentViewWorkLogDetail_WithAttachments() {
        MentoringWorkLogAttachment att = MentoringWorkLogAttachment.builder()
                .id(1L)
                .fileName("db_diagram.png")
                .fileUrl("https://storage.alumnect.vn/db_diagram.png")
                .mediaType(MediaType.IMAGE)
                .build();
        pendingLog.addAttachment(att);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(10L, 1L)).thenReturn(Optional.of(pendingLog));
        when(workLogMapper.toWorkLogResponse(pendingLog)).thenReturn(
                MentoringWorkLogResponse.builder().id(10L).status(WorkLogStatus.PENDING_CONFIRMATION).build()
        );

        MentoringWorkLogResponse result = workLogService.getWorkLogDetail(student.getId(), 1L, 10L);

        assertThat(result).isNotNull();
        assertThat(result.getCanConfirm()).isTrue();
    }

    @Test
    @DisplayName("TC108-03: Student khác không xem được Work Log của Task không thuộc về mình")
    void testOtherStudentCannotViewWorkLogs_ThrowsForbidden() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.getWorkLogsByTaskId(otherStudent.getId(), 1L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không có quyền truy cập");
    }

    @Test
    @DisplayName("TC108-04 & TC108-05: Work Log Confirmed không còn action confirm")
    void testConfirmedLog_HasNoConfirmAction() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(20L, 1L)).thenReturn(Optional.of(confirmedLog));
        when(workLogMapper.toWorkLogResponse(confirmedLog)).thenReturn(
                MentoringWorkLogResponse.builder().id(20L).status(WorkLogStatus.CONFIRMED).build()
        );

        MentoringWorkLogResponse result = workLogService.getWorkLogDetail(student.getId(), 1L, 20L);

        assertThat(result.getCanConfirm()).isFalse();
        assertThat(result.getCanReject()).isFalse();
        assertThat(result.getCanEdit()).isFalse();
    }

    // =========================================================================
    // TC108-06 -> TC108-12: Confirmation Flow & Idempotency
    // =========================================================================

    @Test
    @DisplayName("TC108-06, TC108-07, TC108-08: Student confirm pending Work Log thành công")
    void testStudentConfirmPendingWorkLog_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(10L, 1L)).thenReturn(Optional.of(pendingLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any())).thenReturn(
                MentoringWorkLogResponse.builder().id(10L).status(WorkLogStatus.CONFIRMED).build()
        );

        ConfirmMentoringWorkLogRequest request = ConfirmMentoringWorkLogRequest.builder()
                .feedback("Hướng dẫn rất tốt và dễ hiểu")
                .build();

        MentoringWorkLogResponse response = workLogService.confirmWorkLog(student.getId(), 1L, 10L, request);

        assertThat(response).isNotNull();
        assertThat(pendingLog.getStatus()).isEqualTo(WorkLogStatus.CONFIRMED);
        assertThat(pendingLog.getConfirmedAt()).isNotNull();
        assertThat(pendingLog.getConfirmedBy()).isEqualTo(student);
        assertThat(pendingLog.getStudentFeedback()).isEqualTo("Hướng dẫn rất tốt và dễ hiểu");

        verify(feedbackRepository).save(any());
        verify(notificationService).sendMentoringWorkLogConfirmedNotification(eq(student), eq(mentor), eq(task), eq(pendingLog));
    }

    @Test
    @DisplayName("TC108-09: Mentor không thể gọi Confirm API (ForbiddenException)")
    void testMentorCannotConfirmWorkLog_ThrowsForbidden() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.confirmWorkLog(mentor.getId(), 1L, 10L, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Chỉ học viên");
    }

    @Test
    @DisplayName("TC108-10: Student khác không thể confirm Work Log")
    void testOtherStudentCannotConfirmWorkLog_ThrowsForbidden() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> workLogService.confirmWorkLog(otherStudent.getId(), 1L, 10L, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Chỉ học viên");
    }

    @Test
    @DisplayName("TC108-11: Không confirm Log không thuộc Task trên URL")
    void testConfirmLogNotInTask_ThrowsResourceNotFound() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workLogService.confirmWorkLog(student.getId(), 1L, 999L, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("TC108-12: Idempotent confirmation - double click/retry không tạo duplicate feedback hay lỗi")
    void testConfirmWorkLog_IdempotentOnRetry() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(20L, 1L)).thenReturn(Optional.of(confirmedLog));
        when(workLogMapper.toWorkLogResponse(confirmedLog)).thenReturn(
                MentoringWorkLogResponse.builder().id(20L).status(WorkLogStatus.CONFIRMED).build()
        );

        MentoringWorkLogResponse response = workLogService.confirmWorkLog(student.getId(), 1L, 20L, null);

        assertThat(response).isNotNull();
        verify(workLogRepository, never()).save(any());
        verify(notificationService, never()).sendMentoringWorkLogConfirmedNotification(any(), any(), any(), any());
    }

    // =========================================================================
    // TC108-13 -> TC108-21: Clarification Request Flow & Resubmission
    // =========================================================================

    @Test
    @DisplayName("TC108-13, TC108-14, TC108-15, TC108-17: Student request clarification thành công")
    void testStudentRequestClarification_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(10L, 1L)).thenReturn(Optional.of(pendingLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any())).thenReturn(
                MentoringWorkLogResponse.builder().id(10L).status(WorkLogStatus.REJECTED).build()
        );

        RejectMentoringWorkLogRequest request = RejectMentoringWorkLogRequest.builder()
                .reason("Vui lòng bổ sung thêm tài liệu hướng dẫn và ảnh minh chứng chạy thử API.")
                .build();

        MentoringWorkLogResponse response = workLogService.rejectWorkLog(student.getId(), 1L, 10L, request);

        assertThat(response).isNotNull();
        assertThat(pendingLog.getStatus()).isEqualTo(WorkLogStatus.REJECTED);
        assertThat(pendingLog.getStudentFeedback()).contains("bổ sung thêm tài liệu");

        verify(feedbackRepository).save(any());
        verify(notificationService).sendMentoringWorkLogRejectedNotification(
                eq(student), eq(mentor), eq(task), eq(pendingLog), eq(request.getReason())
        );
    }

    @Test
    @DisplayName("TC108-16: Empty reason khi request clarification bị từ chối (BadRequestException)")
    void testRequestClarification_EmptyReason_ThrowsBadRequest() {
        RejectMentoringWorkLogRequest request = RejectMentoringWorkLogRequest.builder()
                .reason("   ")
                .build();

        assertThatThrownBy(() -> workLogService.rejectWorkLog(student.getId(), 1L, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("tối thiểu 5 ký tự");
    }

    @Test
    @DisplayName("TC108-19, TC108-20, TC108-21: Mentor resubmit sau khi nhận clarification - tăng revision và quay về PENDING_CONFIRMATION")
    void testMentorResubmitAfterClarification_IncrementsRevisionAndResetsPending() {
        pendingLog.setStatus(WorkLogStatus.REJECTED);
        pendingLog.setStudentFeedback("Thiếu file sơ đồ cơ sở dữ liệu");
        pendingLog.setRevisionNumber(1);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(10L, 1L)).thenReturn(Optional.of(pendingLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any())).thenReturn(
                MentoringWorkLogResponse.builder().id(10L).status(WorkLogStatus.PENDING_CONFIRMATION).revisionNumber(2).build()
        );

        UpdateMentoringWorkLogRequest updateRequest = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Thiết kế sơ đồ CSDL (đã bổ sung ảnh ERD)")
                .workCompleted("Đã vẽ đầy đủ diagram và lưu trữ vào cloud")
                .result("Hoàn tất thiết kế CSDL v2")
                .build();

        MentoringWorkLogResponse response = workLogService.updateWorkLog(mentor.getId(), 1L, 10L, updateRequest);

        assertThat(response).isNotNull();
        assertThat(pendingLog.getStatus()).isEqualTo(WorkLogStatus.PENDING_CONFIRMATION);
        assertThat(pendingLog.getRevisionNumber()).isEqualTo(2);

        verify(revisionRepository).save(any());
        verify(notificationService).sendMentoringWorkLogResubmittedNotification(eq(mentor), eq(student), eq(task), eq(pendingLog));
    }

    // =========================================================================
    // TC108-22 -> TC108-25: Data Integrity & Evidence Preservation
    // =========================================================================

    @Test
    @DisplayName("TC108-22: Confirmed Work Log không thể bị Mentor chỉnh sửa (ConflictException)")
    void testConfirmedWorkLog_CannotBeEditedByMentor() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(20L, 1L)).thenReturn(Optional.of(confirmedLog));

        UpdateMentoringWorkLogRequest updateRequest = UpdateMentoringWorkLogRequest.builder()
                .logDate(LocalDate.now())
                .description("Sửa đổi sau khi confirm")
                .workCompleted("Hack")
                .result("Hack")
                .build();

        assertThatThrownBy(() -> workLogService.updateWorkLog(mentor.getId(), 1L, 20L, updateRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("đã được học viên xác nhận nghiệm thu");
    }

    @Test
    @DisplayName("TC108-23, TC108-24, TC108-25: Confirming Work Log không làm thay đổi trạng thái Task, Payment hay Deal")
    void testConfirmWorkLog_DoesNotAlterTaskOrDealStatus() {
        MentoringDeal deal = MentoringDeal.builder()
                .id(501L)
                .isPaid(true)
                .agreedPrice(java.math.BigDecimal.valueOf(5000000))
                .build();
        task.setDeal(deal);
        task.setStatus(MentoringTaskStatus.IN_PROGRESS);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(workLogRepository.findByIdAndTaskId(10L, 1L)).thenReturn(Optional.of(pendingLog));
        when(workLogRepository.save(any(MentoringWorkLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workLogMapper.toWorkLogResponse(any())).thenReturn(
                MentoringWorkLogResponse.builder().id(10L).status(WorkLogStatus.CONFIRMED).build()
        );

        workLogService.confirmWorkLog(student.getId(), 1L, 10L, null);

        // Verify task status is strictly maintained
        assertThat(task.getStatus()).isEqualTo(MentoringTaskStatus.IN_PROGRESS);
        assertThat(task.getDeal().getIsPaid()).isTrue();
        assertThat(task.getAgreedPrice()).isEqualByComparingTo(java.math.BigDecimal.valueOf(5000000));
    }
}
