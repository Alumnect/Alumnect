import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { MentoringConversationContext } from '../model/mentoringConversationTypes'

/**
 * API Chat for Task (Conversation MENTORING) của chuỗi Request → Deal → Payment → Task.
 */
export const mentoringConversationApi = {
  /**
   * GET /mentoring/conversations/{conversationId}
   * Lấy ngữ cảnh đầy đủ của Chat for Task (403 nếu không phải thành viên).
   */
  getContext: async (conversationId: number): Promise<MentoringConversationContext> => {
    const res = await http.get<unknown, ApiResponse<MentoringConversationContext>>(
      `/mentoring/conversations/${conversationId}`
    )
    return res.data
  },

  /**
   * GET /mentoring/conversations/by-request/{requestId}
   * Học viên lấy toàn bộ Chat for Task của Request; Mentor chỉ nhận cuộc hội thoại của mình.
   */
  getByRequest: async (requestId: number): Promise<MentoringConversationContext[]> => {
    const res = await http.get<unknown, ApiResponse<MentoringConversationContext[]>>(
      `/mentoring/conversations/by-request/${requestId}`
    )
    return res.data
  },
}
