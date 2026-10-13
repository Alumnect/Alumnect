import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  MentoringDeal,
  MentoringDealDetail,
  MentoringDealStatus,
  PageResponse,
  ProposeDealPayload,
  UpdateDealPayload,
} from '../model/mentoringDealTypes'

/**
 * API client phục vụ nghiệp vụ Thỏa thuận & xác nhận Mentoring Deal (UC104).
 */
export const mentoringDealApi = {
  /**
   * Khởi tạo đề xuất thỏa thuận Mentoring Deal mới (Student hoặc Mentor).
   */
  proposeDeal: async (payload: ProposeDealPayload): Promise<MentoringDeal> => {
    const res = await http.post<any, ApiResponse<MentoringDeal>>(
      '/mentoring/deals',
      payload
    )
    return res.data
  },

  /**
   * Điều chỉnh điều khoản thỏa thuận và sinh phiên bản Snapshot mới.
   */
  updateDealTerms: async (
    dealId: number,
    payload: UpdateDealPayload
  ): Promise<MentoringDeal> => {
    const res = await http.put<any, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}`,
      payload
    )
    return res.data
  },

  /**
   * Xác nhận Snapshot hiện tại từ một bên tham gia.
   */
  confirmDeal: async (dealId: number): Promise<MentoringDeal> => {
    const res = await http.post<any, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/confirm`
    )
    return res.data
  },

  /**
   * Lấy thông tin chi tiết toàn diện của Deal kèm lịch sử các snapshot.
   */
  getDealDetail: async (dealId: number): Promise<MentoringDealDetail> => {
    const res = await http.get<any, ApiResponse<MentoringDealDetail>>(
      `/mentoring/deals/${dealId}`
    )
    return res.data
  },

  /**
   * Lấy danh sách phân trang các Deal mà người dùng tham gia.
   */
  getMyDeals: async (
    status?: MentoringDealStatus,
    page = 0,
    size = 10
  ): Promise<PageResponse<MentoringDeal>> => {
    const params: Record<string, any> = { page, size }
    if (status) params.status = status
    const res = await http.get<any, ApiResponse<PageResponse<MentoringDeal>>>(
      '/mentoring/deals',
      { params }
    )
    return res.data
  },

  /**
   * Lấy Deal mới nhất gắn với cuộc hội thoại Direct Messaging.
   */
  getDealByConversation: async (
    conversationId: number
  ): Promise<MentoringDealDetail | null> => {
    const res = await http.get<any, ApiResponse<MentoringDealDetail | null>>(
      `/mentoring/deals/by-conversation/${conversationId}`
    )
    return res.data
  },

  /**
   * Hủy bỏ thỏa thuận Deal khi chưa bị khóa chốt.
   */
  cancelDeal: async (dealId: number, reason?: string): Promise<MentoringDeal> => {
    const res = await http.post<any, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/cancel`,
      null,
      { params: reason ? { reason } : undefined }
    )
    return res.data
  },

  /**
   * Từ chối Deal Ticket (UC104).
   */
  rejectDeal: async (dealId: number, reason?: string): Promise<MentoringDeal> => {
    const res = await http.post<any, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/reject`,
      null,
      { params: reason ? { reason } : undefined }
    )
    return res.data
  },

  /**
   * Yêu cầu điều chỉnh Deal Ticket (UC104).
   */
  requestAdjustment: async (dealId: number, note?: string): Promise<MentoringDeal> => {
    const res = await http.post<any, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/request-adjustment`,
      null,
      { params: note ? { note } : undefined }
    )
    return res.data
  },
}
