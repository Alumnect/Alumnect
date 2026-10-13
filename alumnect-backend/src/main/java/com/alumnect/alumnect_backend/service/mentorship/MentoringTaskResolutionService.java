package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.*;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;

import java.util.List;

/**
 * Service xử lý các nghiệp vụ thương lượng, gia hạn và điều chỉnh Task chưa hoàn thành (UC109).
 */
public interface MentoringTaskResolutionService {

    // 1. Deadline Extension Ticket (UC109)
    MentoringTaskDeadlineExtensionResponse createDeadlineExtension(Long currentUserId, Long taskId, CreateDeadlineExtensionRequest request);
    MentoringTaskDeadlineExtensionResponse respondDeadlineExtension(Long currentUserId, Long extensionId, RespondDeadlineExtensionRequest request);
    List<MentoringTaskDeadlineExtensionResponse> getDeadlineExtensions(Long currentUserId, Long taskId);
    MentoringTaskDeadlineExtensionResponse getActiveExtension(Long currentUserId, Long taskId);

    // 2. Task Amendment Ticket (UC109, mục 5.8)
    MentoringTaskAmendmentResponse createTaskAmendment(Long currentUserId, Long taskId, CreateTaskAmendmentRequest request);
    MentoringTaskAmendmentResponse respondTaskAmendment(Long currentUserId, Long amendmentId, RespondTaskAmendmentRequest request);
    List<MentoringTaskAmendmentResponse> getTaskAmendments(Long currentUserId, Long taskId);
    MentoringTaskAmendmentResponse getActiveAmendment(Long currentUserId, Long taskId);

    // 3. Task Settlement Proposal (UC109)
    MentoringTaskSettlementProposalResponse createSettlementProposal(Long currentUserId, Long taskId, CreateSettlementProposalRequest request);
    MentoringTaskSettlementProposalResponse respondSettlementProposal(Long currentUserId, Long proposalId, RespondSettlementProposalRequest request);
    List<MentoringTaskSettlementProposalResponse> getSettlementProposals(Long currentUserId, Long taskId);
    MentoringTaskSettlementProposalResponse getActiveSettlementProposal(Long currentUserId, Long taskId);
}
