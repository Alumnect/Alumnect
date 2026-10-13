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
}
