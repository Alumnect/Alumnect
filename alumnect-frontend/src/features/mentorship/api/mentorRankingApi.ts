import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  MentorRankingPageResponse,
  MentorRankingParams,
} from '../model/mentorRankingTypes'

/**
 * Tầng giao tiếp API cho tính năng Xem bảng xếp hạng Mentor (UC97).
 */
export const mentorRankingApi = {
  /**
   * Lấy danh sách bảng xếp hạng Mentor theo lĩnh vực chuyên môn (có phân trang).
   * Endpoint: GET /api/v1/mentoring/ranking?fieldId={fieldId}&page={page}&size={size}
   */
  getRanking: async (params: MentorRankingParams): Promise<MentorRankingPageResponse> => {
    const res = await http.get<any, ApiResponse<MentorRankingPageResponse>>('/mentoring/ranking', {
      params: {
        fieldId: params.fieldId,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    })
    return res.data
  },
}
