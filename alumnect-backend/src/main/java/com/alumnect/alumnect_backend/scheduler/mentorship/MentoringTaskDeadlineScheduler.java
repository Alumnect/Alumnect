package com.alumnect.alumnect_backend.scheduler.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.NotificationType;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.notification.NotificationRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.service.mentorship.MentoringConversationService;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Theo dõi deadline Task đang thực hiện: nhắc trước 24 giờ và báo quá hạn cho cả Học viên lẫn Mentor
 * (mỗi mốc chỉ báo một lần, gợi ý gia hạn / thỏa thuận dừng / khiếu nại).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MentoringTaskDeadlineScheduler {

    private static final List<MentoringTaskStatus> RUNNING = List.of(MentoringTaskStatus.PREPARATION, MentoringTaskStatus.IN_PROGRESS);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final MentoringTaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final MentoringConversationService conversationService;

    @Scheduled(cron = "${app.mentoring.task-deadline-cron:0 20 * * * *}")
    @Transactional
    public void checkDeadlines() {
        Instant now = Instant.now();
        for (MentoringTask task : taskRepository.findByStatusInAndDeadlineBefore(RUNNING, now.plus(Duration.ofHours(24)))) {
            try {
                if (task.getDeadline().isBefore(now)) {
                    notifyOverdue(task);
                } else {
                    String content = "Task \"" + task.getTaskTitle() + "\" sẽ đến hạn lúc " + TIME.format(task.getDeadline())
                            + ". Nếu cần thêm thời gian, Mentor có thể gửi Ticket gia hạn.";
                    notificationService.sendMentoringTaskEventNotification(null, task.getMentor(), task,
                            "DEADLINE_SOON", task.getDeadline().toString(), "Task sắp đến hạn", content);
                    notificationService.sendMentoringTaskEventNotification(null, task.getStudent(), task,
                            "DEADLINE_SOON", task.getDeadline().toString(), "Task sắp đến hạn", content);
                }
            } catch (Exception ex) {
                log.warn("Không thể xử lý deadline Task id={}: {}", task.getId(), ex.getMessage());
            }
        }
    }

    private void notifyOverdue(MentoringTask task) {
        String eventId = task.getDeadline().toString();
        boolean alreadyNotified = notificationRepository.existsByRecipientIdAndTypeAndTargetTypeAndTargetId(
                task.getMentor().getId(), NotificationType.MENTORING_TASK, "MENTORING_TASK_OVERDUE", task.getId() + ":" + eventId);
        if (alreadyNotified) return;

        notificationService.sendMentoringTaskEventNotification(null, task.getMentor(), task, "OVERDUE", eventId,
                "Task đã quá hạn",
                "Task \"" + task.getTaskTitle() + "\" đã quá deadline. Hãy nộp kết quả hoặc gửi Ticket gia hạn cho Học viên.");
        notificationService.sendMentoringTaskEventNotification(null, task.getStudent(), task, "OVERDUE", eventId,
                "Task đã quá hạn",
                "Task \"" + task.getTaskTitle() + "\" đã quá deadline. Bạn có thể trao đổi với Mentor, thỏa thuận dừng Task hoặc mở khiếu nại.");
        if (task.getConversation() != null) {
            conversationService.postSystemMessage(task.getConversation(), task.getMentor(),
                    "⏰ Task đã quá deadline (" + TIME.format(task.getDeadline()) + "). Mentor cần nộp kết quả hoặc đề xuất gia hạn; "
                            + "Học viên có thể thỏa thuận dừng Task hoặc mở khiếu nại.");
        }
        log.info("Task id={} quá hạn, đã thông báo hai bên", task.getId());
    }
}
