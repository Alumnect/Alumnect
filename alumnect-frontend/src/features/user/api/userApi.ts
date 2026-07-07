import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { ChangePasswordPayload } from '../model/userTypes'

export const userApi = {
  /**
   * Thay đổi mật khẩu tài khoản người dùng hiện tại
   */
  changePassword: (payload: ChangePasswordPayload) =>
    http.post<any, ApiResponse<void>>('/users/change-password', payload),
}
