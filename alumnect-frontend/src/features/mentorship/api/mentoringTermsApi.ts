import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { MentoringTermsStatus, MentoringTermsAcceptResult } from '../model/mentoringTermsTypes'

/**
 * Tầng giao tiếp API cho Điều khoản Hướng dẫn & Hỗ trợ (UC90).
 * Tự động gắn Bearer Token thông qua interceptor của http client.
 * Tuyệt đối không gửi userId từ Frontend (Backend tự lấy từ JWT).
 */
export const mentoringTermsApi = {
  /**
   * Lấy trạng thái chấp nhận điều khoản Hướng dẫn & Hỗ trợ hiện tại của người dùng.
   * Endpoint: GET /api/v1/mentoring/terms/status
   *
   * @returns Thông tin phiên bản hiện tại và cờ accepted
   */
  getStatus: async (): Promise<MentoringTermsStatus> => {
    const res = await http.get<any, ApiResponse<MentoringTermsStatus>>('/mentoring/terms/status')
    return res.data
  },

  /**
   * Ghi nhận chấp nhận điều khoản phiên bản hiện tại.
   * Endpoint: POST /api/v1/mentoring/terms/accept
   *
   * @returns Thông tin kết quả chấp nhận điều khoản
   */
  acceptTerms: async (): Promise<MentoringTermsAcceptResult> => {
    const res = await http.post<any, ApiResponse<MentoringTermsAcceptResult>>('/mentoring/terms/accept', {})
    return res.data
  },
}
