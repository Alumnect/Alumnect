import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  SubmitVerificationPayload,
  VerificationStatusResponse,
} from '../model/verificationTypes'

/**
 * Các hàm gọi API phục vụ luồng xác minh và nâng cấp tài khoản từ Sinh viên lên Cựu sinh viên (UC08).
 */
export const verificationApi = {
  /**
   * Lấy trạng thái yêu cầu xác minh / nâng cấp Cựu sinh viên gần nhất của người dùng hiện tại.
   * GET /api/v1/verifications/me
   */
  getMyStatus: () =>
    http.get<any, ApiResponse<VerificationStatusResponse>>('/verifications/me'),

  /**
   * Gửi yêu cầu nâng cấp tài khoản từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI).
   * POST /api/v1/verifications/upgrade-alumni
   */
  submitUpgradeRequest: (payload: SubmitVerificationPayload) =>
    http.post<any, ApiResponse<VerificationStatusResponse>>(
      '/verifications/upgrade-alumni',
      payload,
    ),
}

