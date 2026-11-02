package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

/**
 * Quy tắc nghiệp vụ dùng chung của module Mentoring về tiền và năng lực nhận việc của Mentor.
 * Tiền VND luôn là số nguyên vì PayOS (thu và chi) chỉ nhận số tiền nguyên.
 */
@Component
@RequiredArgsConstructor
public class MentoringRules {

    /** Task đang chiếm năng lực của Mentor */
    public static final List<MentoringTaskStatus> ACTIVE_TASK_STATUSES = List.of(
            MentoringTaskStatus.PREPARATION, MentoringTaskStatus.IN_PROGRESS,
            MentoringTaskStatus.SUBMITTED, MentoringTaskStatus.DISPUTED);

    private final MentoringTaskRepository taskRepository;
    private final com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository ledgerRepository;

    /** Số tiền tối thiểu cho một khoản thu qua PayOS (giá Deal, tiền bổ sung) */
    @Getter
    @Value("${app.mentoring.min-amount:2000}")
    private long minAmount;

    /** Số Task đang thực hiện tối đa của một Mentor tại cùng thời điểm */
    @Getter
    @Value("${app.mentoring.max-active-tasks-per-mentor:5}")
    private int maxActiveTasksPerMentor;

    /** Số tiền phải là số nguyên VND, không âm. */
    public void requireWholeVnd(BigDecimal amount, String label) {
        if (amount == null) {
            throw new BadRequestException(label + " không được để trống.");
        }
        if (amount.signum() < 0) {
            throw new BadRequestException(label + " không được âm.");
        }
        if (amount.stripTrailingZeros().scale() > 0) {
            throw new BadRequestException(label + " phải là số nguyên VND (không có phần lẻ).");
        }
    }

    /** Khoản tiền cần thu qua PayOS: số nguyên VND và không nhỏ hơn mức tối thiểu. */
    public void requirePayableAmount(BigDecimal amount, String label) {
        requireWholeVnd(amount, label);
        if (amount.compareTo(BigDecimal.valueOf(minAmount)) < 0) {
            throw new BadRequestException(label + " phải từ " + formatVnd(BigDecimal.valueOf(minAmount)) + " trở lên.");
        }
    }

    /** Mentor còn năng lực nhận thêm Task hay không. */
    public void requireMentorCapacity(Long mentorUserId) {
        long active = taskRepository.countByMentorIdAndStatusIn(mentorUserId, ACTIVE_TASK_STATUSES);
        if (active >= maxActiveTasksPerMentor) {
            throw new ConflictException("Mentor đang thực hiện " + active + " Task (tối đa " + maxActiveTasksPerMentor
                    + "). Vui lòng hoàn tất bớt Task trước khi nhận thêm.");
        }
    }

    /** Số tiền thật đang giữ trong quỹ Task = đã thu − đã/đang chi Mentor − đã/đang hoàn Học viên. */
    public BigDecimal escrowBalance(Long taskId) {
        BigDecimal balance = BigDecimal.ZERO;
        for (var ledger : ledgerRepository.findByTaskId(taskId)) {
            var status = ledger.getStatus();
            switch (ledger.getTransactionType()) {
                case ESCROW_COLLECTION -> {
                    if (status == com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus.SUCCEEDED) {
                        balance = balance.add(ledger.getAmount());
                    }
                }
                case PAYOUT, REFUND -> {
                    if (status != com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus.FAILED) {
                        balance = balance.subtract(ledger.getAmount());
                    }
                }
            }
        }
        return balance.max(BigDecimal.ZERO);
    }

    public static String formatVnd(BigDecimal amount) {
        return NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(amount);
    }
}
