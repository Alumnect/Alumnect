import axios from 'axios'
import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { PageResponse } from '../model/mentoringDealTypes'
import type {
  ConfirmWorkLogPayload,
  CreateTaskPaymentRequest,
  CreateWorkLogPayload,
  MentoringTask,
  MentoringTaskDetail,
  MentoringTaskPaymentCheckoutResponse,
  MentoringTaskPaymentStatusResponse,
  MentoringTaskStatus,
  MentoringWorkLog,
  RejectWorkLogPayload,
  UpdateWorkLogPayload,
  WorkLogAttachmentPayload,
  AttachmentMediaType,
  MentoringTaskDeadlineExtension,
  MentoringTaskAmendment,
  MentoringTaskSettlementProposal,
  CreateDeadlineExtensionPayload,
  RespondDeadlineExtensionPayload,
  CreateTaskAmendmentPayload,
  RespondTaskAmendmentPayload,
  CreateSettlementProposalPayload,
  RespondSettlementProposalPayload,
  MentoringTaskCompletion,
  SubmitTaskCompletionPayload,
  RespondTaskCompletionPayload,
  MentoringSettlementSnapshot,
  MentoringDisputeTicket,
  CreateDisputeTicketPayload,
  TicketEvidence,
  TicketEvidencePayload,
  MentoringTaskReport,
} from '../model/mentoringTaskTypes'

export interface PresignedUrlData {
  uploadUrl: string
  publicUrl: string
}

/**
 * API client phục vụ nghiệp vụ Thanh toán Mentoring Task (UC105), Quản lý Task (UC106) & Work Log (UC107).
 */
export const mentoringTaskApi = {
  /**
   * Khởi tạo giao dịch thanh toán PayOS VietQR từ Deal đã xác nhận (UC105).
   */
  createPaymentCheckout: async (
    payload: CreateTaskPaymentRequest
  ): Promise<MentoringTaskPaymentCheckoutResponse> => {
    const res = await http.post<any, ApiResponse<MentoringTaskPaymentCheckoutResponse>>(
      '/mentoring/task-payments/checkout',
      payload
    )
    return res.data
  },

  /**
   * Tra cứu trạng thái thanh toán & kích hoạt Task (Polling fallback).
   */
  checkPaymentStatus: async (
    orderCode: number
  ): Promise<MentoringTaskPaymentStatusResponse> => {
    const res = await http.get<any, ApiResponse<MentoringTaskPaymentStatusResponse>>(
      `/mentoring/task-payments/${orderCode}/status`
    )
    return res.data
  },

  /**
   * Hủy phiên thanh toán chưa hoàn tất.
   */
  cancelPayment: async (
    orderCode: number,
    reason?: string
  ): Promise<MentoringTaskPaymentStatusResponse> => {
    const res = await http.post<any, ApiResponse<MentoringTaskPaymentStatusResponse>>(
      `/mentoring/task-payments/${orderCode}/cancel`,
      null,
      { params: reason ? { reason } : undefined }
    )
    return res.data
  },

  /**
   * Lấy chi tiết toàn diện Mentoring Task tổng hợp 10 sections nghiệp vụ (UC106).
   */
  getTaskDetail: async (taskId: number): Promise<MentoringTaskDetail> => {
    const res = await http.get<any, ApiResponse<MentoringTaskDetail>>(
      `/mentoring/tasks/${taskId}`
    )
    return res.data
  },

  /**
   * Tra cứu Task theo Deal ID.
   */
  getTaskByDealId: async (dealId: number): Promise<MentoringTaskDetail> => {
    const res = await http.get<any, ApiResponse<MentoringTaskDetail>>(
      `/mentoring/tasks/by-deal/${dealId}`
    )
    return res.data
  },

  /**
   * Lấy danh sách Mentoring Tasks của người dùng hiện tại (UC106 - phân trang và lọc theo stage/status).
   */
  getMyTasks: async (params?: {
    stage?: string
    status?: MentoringTaskStatus
    page?: number
    size?: number
  }): Promise<PageResponse<MentoringTask>> => {
    const res = await http.get<any, ApiResponse<PageResponse<MentoringTask>>>(
      '/mentoring/tasks/my-tasks',
      { params }
    )
    return res.data
  },

  /**
   * Lấy danh sách Work Logs của một Mentoring Task (UC106 & UC107).
   */
  getWorkLogs: async (taskId: number): Promise<MentoringWorkLog[]> => {
    const res = await http.get<any, ApiResponse<MentoringWorkLog[]>>(
      `/mentoring/tasks/${taskId}/work-logs`
    )
    return res.data
  },

  /**
   * Lấy chi tiết một Work Log theo ID (UC107).
   */
  getWorkLogDetail: async (taskId: number, workLogId: number): Promise<MentoringWorkLog> => {
    const res = await http.get<any, ApiResponse<MentoringWorkLog>>(
      `/mentoring/tasks/${taskId}/work-logs/${workLogId}`
    )
    return res.data
  },

  /**
   * Mentor tạo Work Log mới (UC107).
   */
  createWorkLog: async (
    taskId: number,
    payload: CreateWorkLogPayload
  ): Promise<MentoringWorkLog> => {
    const res = await http.post<any, ApiResponse<MentoringWorkLog>>(
      `/mentoring/tasks/${taskId}/work-logs`,
      payload
    )
    return res.data
  },

  /**
   * Mentor cập nhật Work Log chưa xác nhận (UC107).
   */
  updateWorkLog: async (
    taskId: number,
    workLogId: number,
    payload: UpdateWorkLogPayload
  ): Promise<MentoringWorkLog> => {
    const res = await http.put<any, ApiResponse<MentoringWorkLog>>(
      `/mentoring/tasks/${taskId}/work-logs/${workLogId}`,
      payload
    )
    return res.data
  },

  /**
   * Học viên xác nhận nghiệm thu Work Log (UC108).
   */
  confirmWorkLog: async (
    taskId: number,
    workLogId: number,
    payload?: ConfirmWorkLogPayload
  ): Promise<MentoringWorkLog> => {
    const res = await http.post<any, ApiResponse<MentoringWorkLog>>(
      `/mentoring/tasks/${taskId}/work-logs/${workLogId}/confirm`,
      payload || {}
    )
    return res.data
  },

  /**
   * Học viên yêu cầu Mentor điều chỉnh Work Log (UC108).
   */
  rejectWorkLog: async (
    taskId: number,
    workLogId: number,
    payload: RejectWorkLogPayload
  ): Promise<MentoringWorkLog> => {
    const res = await http.post<any, ApiResponse<MentoringWorkLog>>(
      `/mentoring/tasks/${taskId}/work-logs/${workLogId}/reject`,
      payload
    )
    return res.data
  },

  /**
   * Upload tệp minh chứng cho Work Log qua Presigned URL lên Cloudflare R2 / S3.
   */
  uploadWorkLogAttachment: async (file: File): Promise<WorkLogAttachmentPayload> => {
    let mediaType: AttachmentMediaType = 'FILE'
    if (file.type.startsWith('image/')) {
      mediaType = 'IMAGE'
    } else if (file.type.startsWith('video/')) {
      mediaType = 'VIDEO'
    }

    const presignedRes = await http.get<any, ApiResponse<PresignedUrlData>>('/files/presigned-url', {
      params: {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder: 'mentoring_work_logs',
      },
    })

    const { uploadUrl, publicUrl } = presignedRes.data

    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    })

    return {
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mediaType,
    }
  },

  /**
   * Tạo đề xuất gia hạn Deadline Task (UC109).
   */
  createDeadlineExtension: async (
    taskId: number,
    payload: CreateDeadlineExtensionPayload
  ): Promise<MentoringTaskDeadlineExtension> => {
    const res = await http.post<any, ApiResponse<MentoringTaskDeadlineExtension>>(
      `/mentoring/tasks/${taskId}/deadline-extensions`,
      payload
    )
    return res.data
  },

  /**
   * Phản hồi (chấp nhận hoặc từ chối) gia hạn Deadline (UC109).
   */
  respondDeadlineExtension: async (
    extensionId: number,
    payload: RespondDeadlineExtensionPayload
  ): Promise<MentoringTaskDeadlineExtension> => {
    const res = await http.put<any, ApiResponse<MentoringTaskDeadlineExtension>>(
      `/mentoring/tasks/deadline-extensions/${extensionId}/respond`,
      payload
    )
    return res.data
  },

  /**
   * Lấy lịch sử các đề xuất gia hạn của Task (UC109).
   */
  getDeadlineExtensions: async (taskId: number): Promise<MentoringTaskDeadlineExtension[]> => {
    const res = await http.get<any, ApiResponse<MentoringTaskDeadlineExtension[]>>(
      `/mentoring/tasks/${taskId}/deadline-extensions`
    )
    return res.data
  },

  /**
   * Lấy đề xuất gia hạn đang hoạt động (UC109).
   */
  getActiveExtension: async (taskId: number): Promise<MentoringTaskDeadlineExtension | null> => {
    const res = await http.get<any, ApiResponse<MentoringTaskDeadlineExtension | null>>(
      `/mentoring/tasks/${taskId}/deadline-extensions/active`
    )
    return res.data
  },

  /**
   * Tạo Ticket điều chỉnh Task và bổ sung tiền (UC109, mục 5.8).
   */
  createTaskAmendment: async (
    taskId: number,
    payload: CreateTaskAmendmentPayload
  ): Promise<MentoringTaskAmendment> => {
    const res = await http.post<any, ApiResponse<MentoringTaskAmendment>>(
      `/mentoring/tasks/${taskId}/amendments`,
      payload
    )
    return res.data
  },

  /**
   * Phản hồi Ticket điều chỉnh Task (UC109).
   */
  respondTaskAmendment: async (
    amendmentId: number,
    payload: RespondTaskAmendmentPayload
  ): Promise<MentoringTaskAmendment> => {
    const res = await http.put<any, ApiResponse<MentoringTaskAmendment>>(
      `/mentoring/tasks/amendments/${amendmentId}/respond`,
      payload
    )
    return res.data
  },

  /**
   * Lấy danh sách các phiên bản điều chỉnh của Task (UC109).
   */
  getTaskAmendments: async (taskId: number): Promise<MentoringTaskAmendment[]> => {
    const res = await http.get<any, ApiResponse<MentoringTaskAmendment[]>>(
      `/mentoring/tasks/${taskId}/amendments`
    )
    return res.data
  },

  /**
   * Tạo đề xuất dừng Task và phân chia tiền (UC109, mục 5.6).
   */
  createSettlementProposal: async (
    taskId: number,
    payload: CreateSettlementProposalPayload
  ): Promise<MentoringTaskSettlementProposal> => {
    const res = await http.post<any, ApiResponse<MentoringTaskSettlementProposal>>(
      `/mentoring/tasks/${taskId}/settlement-proposals`,
      payload
    )
    return res.data
  },

  /**
   * Phản hồi đề xuất dừng Task và phân chia tiền (UC109).
   */
  respondSettlementProposal: async (
    proposalId: number,
    payload: RespondSettlementProposalPayload
  ): Promise<MentoringTaskSettlementProposal> => {
    const res = await http.put<any, ApiResponse<MentoringTaskSettlementProposal>>(
      `/mentoring/tasks/settlement-proposals/${proposalId}/respond`,
      payload
    )
    return res.data
  },

  /**
   * Lấy lịch sử đề xuất phân chia tiền dừng Task (UC109).
   */
  getSettlementProposals: async (taskId: number): Promise<MentoringTaskSettlementProposal[]> => {
    const res = await http.get<any, ApiResponse<MentoringTaskSettlementProposal[]>>(
      `/mentoring/tasks/${taskId}/settlement-proposals`
    )
    return res.data
  },

  /**
   * Mentor nộp kết quả nghiệm thu hoàn thành Task (UC110).
   */
  submitTaskCompletion: async (
    taskId: number,
    payload: SubmitTaskCompletionPayload
  ): Promise<MentoringTaskCompletion> => {
    const res = await http.post<any, ApiResponse<MentoringTaskCompletion>>(
      `/mentoring/tasks/${taskId}/completions`,
      payload
    )
    return res.data
  },

  /**
   * Student xác nhận hoặc từ chối nghiệm thu hoàn thành Task (UC110).
   */
  respondTaskCompletion: async (
    taskId: number,
    completionId: number,
    payload: RespondTaskCompletionPayload
  ): Promise<MentoringTaskCompletion> => {
    const res = await http.put<any, ApiResponse<MentoringTaskCompletion>>(
      `/mentoring/tasks/${taskId}/completions/${completionId}/respond`,
      payload
    )
    return res.data
  },

  /**
   * Lấy lần nộp kết quả nghiệm thu mới nhất của Task (UC110).
   */
  getLatestTaskCompletion: async (taskId: number): Promise<MentoringTaskCompletion | null> => {
    const res = await http.get<any, ApiResponse<MentoringTaskCompletion | null>>(
      `/mentoring/tasks/${taskId}/completions/latest`
    )
    return res.data
  },

  /**
   * Lấy lịch sử các lần nộp kết quả nghiệm thu của Task (UC110).
   */
  getTaskCompletionHistory: async (taskId: number): Promise<MentoringTaskCompletion[]> => {
    const res = await http.get<any, ApiResponse<MentoringTaskCompletion[]>>(
      `/mentoring/tasks/${taskId}/completions`
    )
    return res.data
  },

  /**
   * Lấy bản ghi snapshot thỏa thuận phân chia tiền chuẩn bị gửi Admin (UC111 Step 14).
   */
  getSettlementSnapshot: async (taskId: number): Promise<MentoringSettlementSnapshot> => {
    const res = await http.get<any, ApiResponse<MentoringSettlementSnapshot>>(
      `/mentoring/tasks/${taskId}/settlement-snapshot`
    )
    return res.data
  },

  /**
   * Gửi Settlement Ticket đã thỏa thuận lên Ban Quản Trị (UC111).
   */
  submitSettlementTicket: async (
    taskId: number,
    payload: { proposalId: number; note?: string }
  ): Promise<MentoringDisputeTicket> => {
    const res = await http.post<any, ApiResponse<MentoringDisputeTicket>>(
      `/mentoring/tasks/${taskId}/settlement-tickets`,
      payload
    )
    return res.data
  },

  /**
   * Lấy Ticket đang mở hoặc đang xử lý của Task (UC111 & UC112).
   */
  getActiveTicket: async (taskId: number): Promise<MentoringDisputeTicket | null> => {
    const res = await http.get<any, ApiResponse<MentoringDisputeTicket | null>>(
      `/mentoring/tasks/${taskId}/tickets/active`
    )
    return res.data
  },

  /**
   * Lấy danh sách toàn bộ Ticket của Task (UC111 & UC112).
   */
  getTaskTickets: async (taskId: number): Promise<MentoringDisputeTicket[]> => {
    const res = await http.get<any, ApiResponse<MentoringDisputeTicket[]>>(
      `/mentoring/tasks/${taskId}/tickets`
    )
    return res.data
  },

  /**
   * Tạo Dispute Ticket khiếu nại tranh chấp gửi Admin (UC112).
   */
  createDisputeTicket: async (
    taskId: number,
    payload: CreateDisputeTicketPayload
  ): Promise<MentoringDisputeTicket> => {
    const res = await http.post<any, ApiResponse<MentoringDisputeTicket>>(
      `/mentoring/tasks/${taskId}/dispute-tickets`,
      payload
    )
    return res.data
  },

  /**
   * Lấy danh sách bằng chứng tranh chấp của Ticket (UC112 & UC113).
   */
  getTicketEvidences: async (ticketId: number): Promise<TicketEvidence[]> => {
    const res = await http.get<any, ApiResponse<TicketEvidence[]>>(
      `/mentoring/tasks/tickets/${ticketId}/evidences`
    )
    return res.data
  },

  /**
   * Bổ sung bằng chứng tranh chấp cho Ticket đang mở (UC113).
   */
  addTicketEvidence: async (
    ticketId: number,
    payload: TicketEvidencePayload
  ): Promise<TicketEvidence> => {
    const res = await http.post<any, ApiResponse<TicketEvidence>>(
      `/mentoring/tasks/tickets/${ticketId}/evidences`,
      payload
    )
    return res.data
  },

  /**
   * Xem báo cáo kết quả Task & trạng thái thanh toán (UC114).
   */
  getTaskReport: async (taskId: number): Promise<MentoringTaskReport> => {
    const res = await http.get<any, ApiResponse<MentoringTaskReport>>(
      `/mentoring/tasks/${taskId}/report`
    )
    return res.data
  },
}

