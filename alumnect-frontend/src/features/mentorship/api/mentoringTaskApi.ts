import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { PageResponse } from '../model/mentoringDealTypes'
import type {
  CreateTaskPaymentRequest,
  MentoringTask,
  MentoringTaskPaymentCheckoutResponse,
  MentoringTaskPaymentStatusResponse,
  MentoringTaskStatus,
} from '../model/mentoringTaskTypes'

/**
 * API client phục vụ nghiệp vụ Thanh toán Mentoring Task (UC105) & Quản lý Task.
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
   * Lấy chi tiết Mentoring Task đã kích hoạt theo ID.
   */
  getTaskDetail: async (taskId: number): Promise<MentoringTask> => {
    const res = await http.get<any, ApiResponse<MentoringTask>>(
      `/mentoring/tasks/${taskId}`
    )
    return res.data
  },

  /**
   * Lấy danh sách Mentoring Tasks của người dùng hiện tại (phân trang).
   */
  getMyTasks: async (params?: {
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
}
