import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'

/**
 * API Client phục vụ nghiệp vụ Xem trạng thái Mentor & Subscription (UC94).
 * Kết nối với Spring Boot API qua endpoint /api/v1/mentoring/status.
 */
export const mentorStatusApi = {
  /**
   * Lấy tổng hợp toàn bộ trạng thái Mentor và Subscription của người dùng đang đăng nhập.
   *
   * @returns Promise trả về MentorStatusResponse
   */
  getMentorStatus: async (): Promise<MentorStatusResponse> => {
    const res = await http.get<any, ApiResponse<MentorStatusResponse>>('/mentoring/status')
    return res.data
  },
}
