import http from '@/lib/http'
import type { Major, RegisterPayload, PresignedUrlResponse } from '../model/authTypes'

export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

export const authApi = {
  /**
   * Lấy danh sách các chuyên ngành từ hệ thống
   */
  getMajors: () => http.get<any, ApiResponse<Major[]>>('/majors'),

  /**
   * Đăng ký tài khoản mới (STUDENT hoặc ALUMNI)
   */
  register: (payload: RegisterPayload) => http.post<any, ApiResponse<void>>('/auth/register', payload),

  /**
   * Xác thực email bằng OTP token
   */
  verifyEmail: (email: string, token: string) => 
    http.get<any, ApiResponse<void>>(`/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`),

  /**
   * Yêu cầu gửi lại mã OTP mới
   */
  resendOtp: (email: string) => 
    http.post<any, ApiResponse<void>>(`/auth/resend-otp?email=${encodeURIComponent(email)}`),

  /**
   * Sinh link ký sẵn để tải lên tệp tin minh chứng R2
   */
  getPresignedUrl: (fileName: string, contentType: string, folder?: string) => 
    http.get<any, ApiResponse<PresignedUrlResponse>>(`/files/presigned-url?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}&folder=${encodeURIComponent(folder ?? 'common')}`),
}
