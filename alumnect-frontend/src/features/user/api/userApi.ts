import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { ChangePasswordPayload, UserProfileResponse } from '../model/userTypes'

export const userApi = {
  /**
   * Thay đổi mật khẩu tài khoản người dùng hiện tại
   */
  changePassword: (payload: ChangePasswordPayload) =>
    http.post<any, ApiResponse<void>>('/users/change-password', payload),

  /**
   * Lấy thông tin hồ sơ của chính mình (yêu cầu Token)
   */
  getOwnProfile: () =>
    http.get<any, ApiResponse<UserProfileResponse>>('/users/profile'),

  /**
   * Lấy thông tin hồ sơ của người dùng khác (Public GET)
   */
  getUserProfile: (userId: number) =>
    http.get<any, ApiResponse<UserProfileResponse>>(`/users/profile/${userId}`),
}
