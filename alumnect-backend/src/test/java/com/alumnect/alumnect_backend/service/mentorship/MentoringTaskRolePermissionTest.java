package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateDeadlineExtensionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskAmendmentRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.Instant;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/** Gia hạn và điều chỉnh/tăng tiền chỉ dành cho Mentor; Học viên chỉ phản hồi, dừng Task hoặc khiếu nại. */
@ExtendWith(MockitoExtension.class)
class MentoringTaskRolePermissionTest {
    static final long STUDENT_ID = 1L, MENTOR_ID = 2L;

    @Mock MentoringTaskRepository taskRepository;
    @InjectMocks MentoringTaskResolutionServiceImpl service;

    @BeforeEach void setup() {
        User student = new User();
        student.setId(STUDENT_ID);
        User mentor = new User();
        mentor.setId(MENTOR_ID);
        MentoringTask task = MentoringTask.builder().id(10L).student(student).mentor(mentor)
                .status(MentoringTaskStatus.IN_PROGRESS).deadline(Instant.now().plusSeconds(86400)).build();
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
    }

    @Test void studentCannotRequestDeadlineExtension() {
        CreateDeadlineExtensionRequest request = CreateDeadlineExtensionRequest.builder()
                .proposedDeadline(Instant.now().plusSeconds(172800)).reason("Cần thêm thời gian").build();
        assertThatThrownBy(() -> service.createDeadlineExtension(STUDENT_ID, 10L, request))
                .isInstanceOf(ForbiddenException.class).hasMessageContaining("Chỉ Mentor");
    }

    @Test void studentCannotRequestAmendment() {
        CreateTaskAmendmentRequest request = CreateTaskAmendmentRequest.builder().reason("Thêm phạm vi").build();
        assertThatThrownBy(() -> service.createTaskAmendment(STUDENT_ID, 10L, request))
                .isInstanceOf(ForbiddenException.class).hasMessageContaining("Chỉ Mentor");
    }
}
