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
   * POST /mentoring/deals — Mentor gửi Deal Ticket trong Chat for Task (Chấp nhận theo Request / Deal lại).
   */
  proposeDeal: async (payload: ProposeDealPayload): Promise<MentoringDeal> => {
    const res = await http.post<unknown, ApiResponse<MentoringDeal>>(
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
    const res = await http.put<unknown, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}`,
      payload
    )
    return res.data
  },

  /**
   * POST /mentoring/deals/{id}/confirm — xác nhận đúng phiên bản đang xem (khóa Deal & chọn Mentor khi hai bên cùng xác nhận).
   */
  confirmDeal: async (dealId: number, version: number): Promise<MentoringDeal> => {
    // Gửi kèm phiên bản đang xem: backend từ chối nếu phiên bản đã bị thay thế
    const res = await http.post<unknown, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/confirm`,
      { version }
    )
    return res.data
  },

  /**
   * Lấy thông tin chi tiết toàn diện của Deal kèm lịch sử các snapshot.
   */
  getDealDetail: async (dealId: number): Promise<MentoringDealDetail> => {
    const res = await http.get<unknown, ApiResponse<MentoringDealDetail>>(
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
    const params: Record<string, string | number> = { page, size }
    if (status) params.status = status
    const res = await http.get<unknown, ApiResponse<PageResponse<MentoringDeal>>>(
      '/mentoring/deals',
      { params }
    )
    return res.data
  },

  /**
   * Lấy luồng Deal của Chat for Task (null nếu Mentor chưa gửi Deal Ticket).
   */
  getDealByConversation: async (
    conversationId: number
  ): Promise<MentoringDealDetail | null> => {
    const res = await http.get<unknown, ApiResponse<MentoringDealDetail | null>>(
      `/mentoring/deals/by-conversation/${conversationId}`
    )
    return res.data
  },

  /**
   * Hủy bỏ thỏa thuận Deal khi chưa bị khóa chốt.
   */
  cancelDeal: async (dealId: number, reason?: string): Promise<MentoringDeal> => {
    const res = await http.post<unknown, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/cancel`,
      null,
      { params: reason ? { reason } : undefined }
    )
    return res.data
  },

  /**
   * Học viên từ chối phiên bản Deal Ticket hiện tại (UC104).
   */
  rejectDeal: async (dealId: number, reason?: string, version?: number): Promise<MentoringDeal> => {
    const res = await http.post<unknown, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/reject`,
      null,
      { params: { ...(reason ? { reason } : {}), ...(version ? { version } : {}) } }
    )
    return res.data
  },

  /**
   * Học viên yêu cầu Mentor điều chỉnh phiên bản hiện tại (UC104).
   */
  requestAdjustment: async (dealId: number, note?: string, version?: number): Promise<MentoringDeal> => {
    const res = await http.post<unknown, ApiResponse<MentoringDeal>>(
      `/mentoring/deals/${dealId}/request-adjustment`,
      null,
      { params: { ...(note ? { note } : {}), ...(version ? { version } : {}) } }
    )
    return res.data
  },
}
