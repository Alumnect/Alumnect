import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  MentorFilterOptions,
  MentorSearchPageResponse,
  MentorSearchParams,
} from '../model/mentorSearchTypes'

/**
 * Tầng giao tiếp API cho tính năng Tìm kiếm & lọc Mentor (UC98).
 */
export const mentorSearchApi = {
  /**
   * Tìm kiếm & lọc danh sách Mentor (có phân trang, chỉ trả về Mentor ACTIVE).
   * Endpoint: GET /api/v1/mentors
   */
  searchMentors: async (params: MentorSearchParams): Promise<MentorSearchPageResponse> => {
    const cleanParams: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 9,
    }

    if (params.keyword?.trim()) {
      cleanParams.keyword = params.keyword.trim()
    }
    if (params.fieldId != null) {
      cleanParams.fieldId = params.fieldId
    }
    if (params.industryName?.trim()) {
      cleanParams.industryName = params.industryName.trim()
    }
    if (params.majorId != null) {
      cleanParams.majorId = params.majorId
    }
    if (params.specialization?.trim()) {
      cleanParams.specialization = params.specialization.trim()
    }
    if (params.skill?.trim()) {
      cleanParams.skill = params.skill.trim()
    }
    if (params.workingMode) {
      cleanParams.workingMode = params.workingMode
    }
    if (params.mentoringType) {
      cleanParams.mentoringType = params.mentoringType
    }
    if (params.sortBy) {
      cleanParams.sortBy = params.sortBy
    }
    if (params.sortDir) {
      cleanParams.sortDir = params.sortDir
    }

    const res = await http.get<any, ApiResponse<MentorSearchPageResponse>>('/mentors', {
      params: cleanParams,
    })
    return res.data
  },

  /**
   * Lấy danh sách metadata các bộ lọc Mentor (ngành nghề, chuyên ngành, kỹ năng, hình thức).
   * Endpoint: GET /api/v1/mentors/filter-options
   */
  getFilterOptions: async (): Promise<MentorFilterOptions> => {
    const res = await http.get<any, ApiResponse<MentorFilterOptions>>('/mentors/filter-options')
    return res.data
  },
}
