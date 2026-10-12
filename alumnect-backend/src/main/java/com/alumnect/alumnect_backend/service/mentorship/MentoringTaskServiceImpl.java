package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Triển khai dịch vụ quản lý Mentoring Task (UC105 & Flow 3, 4).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTaskServiceImpl implements MentoringTaskService {

    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskMapper taskMapper;

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskResponse getTaskDetail(Long currentUserId, Long taskId) {
        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        if (!task.getStudent().getId().equals(currentUserId) && !task.getMentor().getId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
        }

        return taskMapper.toTaskResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskResponse getTaskByDealId(Long currentUserId, Long dealId) {
        MentoringTask task = taskRepository.findByDealId(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có Mentoring Task nào được kích hoạt cho Deal ID: " + dealId));

        if (!task.getStudent().getId().equals(currentUserId) && !task.getMentor().getId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
        }

        return taskMapper.toTaskResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentoringTaskResponse> getMyTasks(Long currentUserId, MentoringTaskStatus status, Pageable pageable) {
        Page<MentoringTask> pageResult;
        if (status != null) {
            pageResult = taskRepository.findByParticipantAndStatus(currentUserId, status, pageable);
        } else {
            pageResult = taskRepository.findByParticipant(currentUserId, pageable);
        }

        List<MentoringTaskResponse> content = pageResult.getContent().stream()
                .map(taskMapper::toTaskResponse)
                .toList();

        return PageResponse.<MentoringTaskResponse>builder()
                .content(content)
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }
}
