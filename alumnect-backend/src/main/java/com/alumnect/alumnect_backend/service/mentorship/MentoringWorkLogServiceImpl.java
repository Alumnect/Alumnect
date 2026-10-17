package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MediaType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogFeedbackRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRevisionRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ConfirmMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RejectMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.WorkLogAttachmentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogAttachment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogFeedback;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogRevision;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Lớp triển khai dịch vụ quản lý nhật ký công việc Mentoring Work Log (UC107 & UC108).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringWorkLogServiceImpl implements MentoringWorkLogService {
    private final MentoringGroupService mentoringGroupService;

    private final MentoringTaskRepository taskRepository;
    private final MentoringWorkLogRepository workLogRepository;
    private final MentoringWorkLogFeedbackRepository feedbackRepository;
    private final MentoringWorkLogRevisionRepository revisionRepository;
    private final MentoringWorkLogMapper workLogMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<MentoringWorkLogResponse> getWorkLogsByTaskId(Long currentUserId, Long taskId) {
        MentoringTask task = findAndVerifyTaskAccess(currentUserId, taskId);

        List<MentoringWorkLog> logs = workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId());
        boolean isMentor = task.getMentor().getId().equals(currentUserId);
        boolean isStudent = task.getStudent().getId().equals(currentUserId);
        boolean taskAllowsAction = task.getStatus() != MentoringTaskStatus.COMPLETED
                && task.getStatus() != MentoringTaskStatus.CANCELLED
                && task.getStatus() != MentoringTaskStatus.DISPUTED;

        return logs.stream().map(logItem -> {
            MentoringWorkLogResponse res = workLogMapper.toWorkLogResponse(logItem);
            boolean canEdit = isMentor && taskAllowsAction && logItem.getStatus() != WorkLogStatus.CONFIRMED;
            boolean canConfirm = isStudent && taskAllowsAction && logItem.getStatus() == WorkLogStatus.PENDING_CONFIRMATION;
            boolean canReject = isStudent && taskAllowsAction && logItem.getStatus() == WorkLogStatus.PENDING_CONFIRMATION;
            res.setCanEdit(canEdit);
            res.setCanConfirm(canConfirm);
            res.setCanReject(canReject);
            if (logItem.getFeedbacks() != null) {
                res.setFeedbacks(workLogMapper.toFeedbackResponseList(logItem.getFeedbacks()));
            }
            if (logItem.getRevisions() != null) {
                res.setRevisions(workLogMapper.toRevisionResponseList(logItem.getRevisions()));
            }
            return res;
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringWorkLogResponse getWorkLogDetail(Long currentUserId, Long taskId, Long workLogId) {
        MentoringTask task = findAndVerifyTaskAccess(currentUserId, taskId);

        MentoringWorkLog workLog = workLogRepository.findByIdAndTaskId(workLogId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký công việc ID: " + workLogId + " thuộc Task ID: " + taskId));

        boolean isMentor = task.getMentor().getId().equals(currentUserId);
        boolean isStudent = task.getStudent().getId().equals(currentUserId);
        boolean taskAllowsAction = task.getStatus() != MentoringTaskStatus.COMPLETED
                && task.getStatus() != MentoringTaskStatus.CANCELLED
                && task.getStatus() != MentoringTaskStatus.DISPUTED;

        MentoringWorkLogResponse response = workLogMapper.toWorkLogResponse(workLog);
        response.setCanEdit(isMentor && taskAllowsAction && workLog.getStatus() != WorkLogStatus.CONFIRMED);
        response.setCanConfirm(isStudent && taskAllowsAction && workLog.getStatus() == WorkLogStatus.PENDING_CONFIRMATION);
        response.setCanReject(isStudent && taskAllowsAction && workLog.getStatus() == WorkLogStatus.PENDING_CONFIRMATION);

        if (workLog.getFeedbacks() != null) {
            response.setFeedbacks(workLogMapper.toFeedbackResponseList(workLog.getFeedbacks()));
        }
        if (workLog.getRevisions() != null) {
            response.setRevisions(workLogMapper.toRevisionResponseList(workLog.getRevisions()));
        }

        return response;
    }

    @Override
    @Transactional
    public MentoringWorkLogResponse createWorkLog(Long currentUserId, Long taskId, CreateMentoringWorkLogRequest request) {
        log.info("Mentor userId={} yêu cầu tạo Work Log cho taskId={}", currentUserId, taskId);

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        // 1. Kiểm tra quyền hạn: Chỉ Mentor của chính Task mới được tạo Work Log
        if (!task.getMentor().getId().equals(currentUserId)) {
            if (task.getStudent().getId().equals(currentUserId)) {
                throw new ForbiddenException("Học viên không có quyền tạo nhật ký công việc (chỉ Mentor phụ trách mới có quyền).");
            }
            throw new ForbiddenException("Bạn không phải là Mentor phụ trách Mentoring Task này.");
        }

        // 2. Kiểm tra trạng thái Task: Task không được ở trạng thái COMPLETED, CANCELLED, hoặc DISPUTED
        if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            throw new ConflictException("Mentoring Task đã hoàn thành, không thể thêm nhật ký công việc mới.");
        }
        if (task.getStatus() == MentoringTaskStatus.CANCELLED) {
            throw new ConflictException("Mentoring Task đã bị hủy bỏ, không thể thêm nhật ký công việc mới.");
        }
        if (task.getStatus() == MentoringTaskStatus.DISPUTED) {
            throw new ConflictException("Mentoring Task đang trong quá trình khiếu nại/tranh chấp, không thể thêm nhật ký công việc.");
        }

        // 3. Nếu Task đang ở PREPARATION, tự động kích hoạt chuyển sang IN_PROGRESS khi bắt đầu có Work Log
        boolean taskJustStarted = task.getStatus() == MentoringTaskStatus.PREPARATION;
        if (taskJustStarted) {
            log.info("Task id={} chuyển từ PREPARATION sang IN_PROGRESS khi có Work Log đầu tiên", task.getId());
            task.setStatus(MentoringTaskStatus.IN_PROGRESS);
            taskRepository.save(task);
        }

        // 4. Tạo bản ghi Work Log với trạng thái PENDING_CONFIRMATION và revisionNumber = 1
        MentoringWorkLog workLog = MentoringWorkLog.builder()
                .task(task)
                .mentor(task.getMentor())
                .logDate(request.getLogDate())
                .description(request.getDescription().trim())
                .workCompleted(request.getWorkCompleted().trim())
                .result(request.getResult().trim())
                .nextAction(request.getNextAction() != null ? request.getNextAction().trim() : null)
                .status(WorkLogStatus.PENDING_CONFIRMATION)
                .revisionNumber(1)
                .build();

        // 5. Đính kèm các tài liệu/minh chứng nếu có
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (WorkLogAttachmentRequest attReq : request.getAttachments()) {
                if (attReq.getFileUrl() != null && !attReq.getFileUrl().isBlank()) {
                    MentoringWorkLogAttachment attachment = MentoringWorkLogAttachment.builder()
                            .fileUrl(attReq.getFileUrl().trim())
                            .fileName(attReq.getFileName().trim())
                            .fileSize(attReq.getFileSize())
                            .mediaType(attReq.getMediaType() != null ? attReq.getMediaType() : MediaType.FILE)
                            .workLog(workLog)
                            .build();
                    workLog.addAttachment(attachment);
                }
            }
        }

        MentoringWorkLog savedLog = workLogRepository.save(workLog);
        saveRevisionSnapshot(savedLog, null);
        log.info("Đã lưu thành công Work Log id={} cho taskId={}", savedLog.getId(), taskId);

        // 6. Gửi thông báo cho Student của Task
        try {
            notificationService.sendMentoringWorkLogNotification(
                    task.getMentor(), task.getStudent(), task, savedLog, taskJustStarted);
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo Work Log tới Student id={}: {}", task.getStudent().getId(), e.getMessage());
        }

        MentoringWorkLogResponse response = workLogMapper.toWorkLogResponse(savedLog);
        response.setCanEdit(true);
        return response;
    }

    @Override
    @Transactional
    public MentoringWorkLogResponse updateWorkLog(Long currentUserId, Long taskId, Long workLogId, UpdateMentoringWorkLogRequest request) {
        log.info("Mentor userId={} yêu cầu cập nhật Work Log id={} cho taskId={}", currentUserId, workLogId, taskId);

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        // 1. Kiểm tra quyền sở hữu Mentor của Task
        if (!task.getMentor().getId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa nhật ký công việc của Mentoring Task này.");
        }

        // 2. Tra cứu Work Log theo id và taskId để chống IDOR
        MentoringWorkLog workLog = workLogRepository.findByIdAndTaskId(workLogId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký công việc ID: " + workLogId + " thuộc Task ID: " + taskId));

        // 3. Kiểm tra trạng thái Task
        if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            throw new ConflictException("Mentoring Task đã hoàn thành, không thể chỉnh sửa nhật ký công việc.");
        }
        if (task.getStatus() == MentoringTaskStatus.CANCELLED) {
            throw new ConflictException("Mentoring Task đã bị hủy bỏ, không thể chỉnh sửa nhật ký công việc.");
        }
        if (task.getStatus() == MentoringTaskStatus.DISPUTED) {
            throw new ConflictException("Mentoring Task đang có tranh chấp, không thể chỉnh sửa nhật ký công việc.");
        }

        // 4. Invariant: Chỉ được sửa khi trạng thái là PENDING_CONFIRMATION hoặc REJECTED (chưa CONFIRMED)
        if (workLog.getStatus() == WorkLogStatus.CONFIRMED) {
            throw new ConflictException("Không thể chỉnh sửa nhật ký công việc đã được học viên xác nhận nghiệm thu.");
        }

        boolean wasRejected = workLog.getStatus() == WorkLogStatus.REJECTED;
        int currentRev = workLog.getRevisionNumber() != null ? workLog.getRevisionNumber() : 1;

        // Nếu nhật ký đang bị từ chối/yêu cầu sửa, khi Mentor nộp lại sẽ chuyển về PENDING_CONFIRMATION và tăng revisionNumber
        if (wasRejected) {
            workLog.setStatus(WorkLogStatus.PENDING_CONFIRMATION);
            workLog.setRevisionNumber(currentRev + 1);
        }

        // 5. Cập nhật các trường thông tin
        workLog.setLogDate(request.getLogDate());
        workLog.setDescription(request.getDescription().trim());
        workLog.setWorkCompleted(request.getWorkCompleted().trim());
        workLog.setResult(request.getResult().trim());
        workLog.setNextAction(request.getNextAction() != null ? request.getNextAction().trim() : null);
        workLog.setUpdatedAt(Instant.now());

        // 6. Cập nhật danh sách tài liệu minh chứng
        workLog.clearAttachments();
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (WorkLogAttachmentRequest attReq : request.getAttachments()) {
                if (attReq.getFileUrl() != null && !attReq.getFileUrl().isBlank()) {
                    MentoringWorkLogAttachment attachment = MentoringWorkLogAttachment.builder()
                            .fileUrl(attReq.getFileUrl().trim())
                            .fileName(attReq.getFileName().trim())
                            .fileSize(attReq.getFileSize())
                            .mediaType(attReq.getMediaType() != null ? attReq.getMediaType() : MediaType.FILE)
                            .workLog(workLog)
                            .build();
                    workLog.addAttachment(attachment);
                }
            }
        }

        MentoringWorkLog updatedLog = workLogRepository.save(workLog);
        saveRevisionSnapshot(updatedLog, updatedLog.getStudentFeedback());
        log.info("Cập nhật thành công Work Log id={} (rev={}) cho taskId={}", updatedLog.getId(), updatedLog.getRevisionNumber(), taskId);

        // 7. Nếu là resubmit sau khi bị yêu cầu điều chỉnh, gửi thông báo lại cho Student
        if (wasRejected) {
            try {
                notificationService.sendMentoringWorkLogResubmittedNotification(task.getMentor(), task.getStudent(), task, updatedLog);
            } catch (Exception e) {
                log.error("Lỗi khi gửi thông báo cập nhật lại Work Log tới Student: {}", e.getMessage());
            }
        }

        MentoringWorkLogResponse response = workLogMapper.toWorkLogResponse(updatedLog);
        response.setCanEdit(true);
        response.setCanConfirm(false);
        response.setCanReject(false);
        return response;
    }

    @Override
    @Transactional
    public MentoringWorkLogResponse confirmWorkLog(Long currentUserId, Long taskId, Long workLogId, ConfirmMentoringWorkLogRequest request) {
        log.info("Student userId={} yêu cầu xác nhận nghiệm thu Work Log id={} cho taskId={}", currentUserId, workLogId, taskId);

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        // 1. Phân quyền: Chỉ Student của chính Task mới được xác nhận
        if (!task.getStudent().getId().equals(currentUserId)) {
            throw new ForbiddenException("Chỉ học viên của Mentoring Task mới có quyền xác nhận nghiệm thu nhật ký công việc.");
        }

        // 2. Tra cứu Work Log
        MentoringWorkLog workLog = workLogRepository.findByIdAndTaskId(workLogId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký công việc ID: " + workLogId + " thuộc Task ID: " + taskId));

        // 3. Kiểm tra trạng thái Task
        if (task.getStatus() == MentoringTaskStatus.CANCELLED || task.getStatus() == MentoringTaskStatus.DISPUTED) {
            throw new ConflictException("Mentoring Task đang bị hủy hoặc khiếu nại, không thể thực hiện xác nhận.");
        }

        // 4. Idempotency: Nếu đã CONFIRMED từ trước (ví dụ do double-click hoặc retry mạng), trả về kết quả an toàn
        if (workLog.getStatus() == WorkLogStatus.CONFIRMED) {
            log.info("Work Log id={} đã được nghiệm thu trước đó, trả về kết quả idempotent", workLogId);
            MentoringWorkLogResponse response = workLogMapper.toWorkLogResponse(workLog);
            response.setCanEdit(false);
            response.setCanConfirm(false);
            response.setCanReject(false);
            if (workLog.getFeedbacks() != null) {
                response.setFeedbacks(workLogMapper.toFeedbackResponseList(workLog.getFeedbacks()));
            }
            if (workLog.getRevisions() != null) {
                response.setRevisions(workLogMapper.toRevisionResponseList(workLog.getRevisions()));
            }
            return response;
        }

        // 5. Cập nhật trạng thái CONFIRMED
        workLog.setStatus(WorkLogStatus.CONFIRMED);
        workLog.setConfirmedAt(Instant.now());
        workLog.setConfirmedBy(task.getStudent());
        String feedbackStr = (request != null && request.getFeedback() != null && !request.getFeedback().isBlank())
                ? request.getFeedback().trim()
                : null;
        if (feedbackStr != null) {
            workLog.setStudentFeedback(feedbackStr);
        }
        workLog.setUpdatedAt(Instant.now());

        MentoringWorkLog saved = workLogRepository.save(workLog);

        // 6. Ghi nhận lịch sử phản hồi (Feedback Audit Record)
        MentoringWorkLogFeedback feedbackRecord = MentoringWorkLogFeedback.builder()
                .workLog(saved)
                .student(task.getStudent())
                .action("CONFIRMED")
                .reason(feedbackStr)
                .revisionNumber(saved.getRevisionNumber() != null ? saved.getRevisionNumber() : 1)
                .build();
        feedbackRepository.save(feedbackRecord);

        log.info("Học viên đã nghiệm thu thành công Work Log id={} cho taskId={}", saved.getId(), taskId);

        // 7. Gửi thông báo đến Mentor
        try {
            notificationService.sendMentoringWorkLogConfirmedNotification(task.getStudent(), task.getMentor(), task, saved);
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo nghiệm thu Work Log tới Mentor: {}", e.getMessage());
        }

        MentoringWorkLogResponse response = workLogMapper.toWorkLogResponse(saved);
        response.setCanEdit(false);
        response.setCanConfirm(false);
        response.setCanReject(false);
        return response;
    }

    @Override
    @Transactional
    public MentoringWorkLogResponse rejectWorkLog(Long currentUserId, Long taskId, Long workLogId, RejectMentoringWorkLogRequest request) {
        log.info("Student userId={} yêu cầu điều chỉnh Work Log id={} cho taskId={}", currentUserId, workLogId, taskId);

        String reason = request != null ? request.resolveReason() : "";
        if (reason == null || reason.trim().length() < 5) {
            throw new BadRequestException("Vui lòng nhập lý do hoặc nội dung yêu cầu điều chỉnh cho Mentor (tối thiểu 5 ký tự).");
        }

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        // 1. Phân quyền: Chỉ Student của chính Task mới được yêu cầu điều chỉnh
        if (!task.getStudent().getId().equals(currentUserId)) {
            throw new ForbiddenException("Chỉ học viên của Mentoring Task mới có quyền yêu cầu điều chỉnh nhật ký công việc.");
        }

        // 2. Tra cứu Work Log
        MentoringWorkLog workLog = workLogRepository.findByIdAndTaskId(workLogId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký công việc ID: " + workLogId + " thuộc Task ID: " + taskId));

        // 3. Kiểm tra trạng thái Task
        if (task.getStatus() == MentoringTaskStatus.CANCELLED || task.getStatus() == MentoringTaskStatus.DISPUTED) {
            throw new ConflictException("Mentoring Task đang bị hủy hoặc khiếu nại, không thể gửi yêu cầu điều chỉnh.");
        }

        // 4. Invariant: Không thể reject khi đã CONFIRMED
        if (workLog.getStatus() == WorkLogStatus.CONFIRMED) {
            throw new ConflictException("Nhật ký công việc đã được nghiệm thu thành công, không thể yêu cầu điều chỉnh.");
        }

        // 5. Cập nhật trạng thái REJECTED kèm góp ý của Student
        workLog.setStatus(WorkLogStatus.REJECTED);
        workLog.setStudentFeedback(reason.trim());
        workLog.setUpdatedAt(Instant.now());

        MentoringWorkLog saved = workLogRepository.save(workLog);

        // 6. Ghi nhận lịch sử phản hồi (Feedback Audit Record)
        MentoringWorkLogFeedback feedbackRecord = MentoringWorkLogFeedback.builder()
                .workLog(saved)
                .student(task.getStudent())
                .action("CLARIFICATION_REQUESTED")
                .reason(reason.trim())
                .revisionNumber(saved.getRevisionNumber() != null ? saved.getRevisionNumber() : 1)
                .build();
        feedbackRepository.save(feedbackRecord);

        log.info("Đã ghi nhận yêu cầu điều chỉnh Work Log id={} cho taskId={}", saved.getId(), taskId);

        // 7. Gửi thông báo đến Mentor
        try {
            notificationService.sendMentoringWorkLogRejectedNotification(task.getStudent(), task.getMentor(), task, saved, reason.trim());
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo yêu cầu điều chỉnh Work Log tới Mentor: {}", e.getMessage());
        }

        MentoringWorkLogResponse response = workLogMapper.toWorkLogResponse(saved);
        response.setCanEdit(false);
        response.setCanConfirm(false);
        response.setCanReject(false);
        return response;
    }

    private void saveRevisionSnapshot(MentoringWorkLog workLog, String feedback) {
        try {
            String attachmentsSummary = (workLog.getAttachments() != null && !workLog.getAttachments().isEmpty())
                    ? workLog.getAttachments().stream()
                        .map(a -> a.getFileName() + " (" + a.getFileUrl() + ")")
                        .reduce((a, b) -> a + "; " + b).orElse("")
                    : "";

            MentoringWorkLogRevision revision = MentoringWorkLogRevision.builder()
                    .workLog(workLog)
                    .revisionNumber(workLog.getRevisionNumber() != null ? workLog.getRevisionNumber() : 1)
                    .mentor(workLog.getMentor())
                    .logDate(workLog.getLogDate())
                    .description(workLog.getDescription())
                    .workCompleted(workLog.getWorkCompleted())
                    .result(workLog.getResult())
                    .nextAction(workLog.getNextAction())
                    .attachmentsSummary(attachmentsSummary)
                    .studentFeedback(feedback)
                    .build();
            revisionRepository.save(revision);
        } catch (Exception e) {
            log.warn("Không thể lưu snapshot revision cho Work Log id={}: {}", workLog.getId(), e.getMessage());
        }
    }

    private MentoringTask findAndVerifyTaskAccess(Long currentUserId, Long taskId) {
        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        if (!task.getStudent().getId().equals(currentUserId) && !task.getMentor().getId().equals(currentUserId)
                && !mentoringGroupService.isActiveMember(task.getRequest(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
        }
        return task;
    }
}
