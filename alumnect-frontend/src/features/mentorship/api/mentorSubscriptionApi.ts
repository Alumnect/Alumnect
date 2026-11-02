import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  MentorPackage,
  SelectMentorPackageRequest,
  MentorSubscription,
} from '../model/mentorSubscriptionTypes'

/**
 * API client phục vụ nghiệp vụ Xem & Chọn gói Mentor (UC92).
 */
export const mentorSubscriptionApi = {
  /**
   * Lấy danh sách các gói dịch vụ Mentor đang hoạt động (ACTIVE).
   */
  getActivePackages: async (): Promise<MentorPackage[]> => {
    const res = await http.get<any, ApiResponse<MentorPackage[]>>(
      '/mentoring/subscriptions/packages'
    )
    return res.data
  },

  /**
   * Lựa chọn gói Mentor và tạo bản ghi chờ thanh toán.
   */
  selectPackage: async (
    data: SelectMentorPackageRequest
  ): Promise<MentorSubscription> => {
    const res = await http.post<any, ApiResponse<MentorSubscription>>(
      '/mentoring/subscriptions/select-package',
      data
    )
    return res.data
  },

  /**
   * Lấy thông tin gói Mentor đã chọn / hiện tại của người dùng.
   */
  getMySubscription: async (): Promise<MentorSubscription> => {
    const res = await http.get<any, ApiResponse<MentorSubscription>>(
      '/mentoring/subscriptions/my-subscription'
    )
    return res.data
  },
}
