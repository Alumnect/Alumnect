import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { ExperienceResponse, ExperienceRequest, PromotionPayload } from '../model/userTypes'

export const experienceApi = {
  /**
   * Lấy danh sách kinh nghiệm làm việc của chính mình
   */
  getExperiences: () =>
    http.get<any, ApiResponse<ExperienceResponse[]>>('/experiences'),

  /**
   * Tạo kinh nghiệm làm việc mới
   */
  createExperience: (payload: ExperienceRequest) =>
    http.post<any, ApiResponse<ExperienceResponse>>('/experiences', payload),

  /**
   * Cập nhật kinh nghiệm làm việc
   */
  updateExperience: (id: number, payload: ExperienceRequest) =>
    http.put<any, ApiResponse<ExperienceResponse>>(`/experiences/${id}`, payload),

  /**
   * Xóa kinh nghiệm làm việc
   */
  deleteExperience: (id: number) =>
    http.delete<any, ApiResponse<void>>(`/experiences/${id}`),

  /**
   * Thăng chức / chuyển đổi vai trò tại công ty
   */
  promoteExperience: (id: number, payload: PromotionPayload) =>
    http.post<any, ApiResponse<ExperienceResponse>>(`/experiences/${id}/promote`, payload),
}
