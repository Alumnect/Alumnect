import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { MentorDetailData } from '../model/mentorDetailTypes'

/**
 * Tầng giao tiếp API cho tính năng Xem chi tiết Mentor (UC99 — View Mentor Detail).
 */
export const mentorDetailApi = {
  /**
   * Lấy thông tin chi tiết công khai của một Mentor theo định danh hợp lệ.
   * Endpoint: GET /api/v1/mentors/{mentorId}
   *
   * @param mentorId ID hồ sơ Mentor (mentorProfileId) hoặc ID người dùng (userId)
   * @returns Thông tin chi tiết hồ sơ Mentor
   */
  getMentorDetail: async (mentorId: number | string): Promise<MentorDetailData> => {
    const res = await http.get<any, ApiResponse<MentorDetailData>>(`/mentors/${mentorId}`)
    return res.data
  },
}
