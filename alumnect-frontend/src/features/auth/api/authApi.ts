import http from '@/lib/http'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser, Role } from '@/store/authStore'
import type { Major, RegisterPayload, PresignedUrlResponse, GoogleRegisterPayload, ResetPasswordPayload, VerifyResetOtpPayload } from '../model/authTypes'
import type { LoginInput, ForgotInput } from '../model/schemas'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  id: number
  email: string
  role: string
  fullName: string
  avatarUrl?: string
  accountStatus: string
}

export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

export type AuthResponse = {
  user: AuthUser
  accessToken: string
  refreshToken: string
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

  /**
   * Đăng nhập lấy JWT token
   */
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const response = await http.post<any, ApiResponse<LoginResponse>>('/auth/login', input)
    const { accessToken, refreshToken, id, email, fullName, role, avatarUrl, accountStatus } = response.data
    return {
      accessToken,
      refreshToken,
      user: {
        id: String(id),
        email,
        name: fullName,
        role: role as Role,
        verified: accountStatus === 'ACTIVE',
        avatarUrl: avatarUrl || undefined
      }
    }
  },

  /**
   * Yêu cầu khôi phục mật khẩu (gửi mã OTP)
   */
  forgotPassword: (input: ForgotInput) =>
    http.post<any, ApiResponse<void>>('/auth/forgot-password', input),

  /**
   * Đặt lại mật khẩu mới bằng mã OTP xác thực
   */
  resetPassword: (payload: ResetPasswordPayload) =>
    http.post<any, ApiResponse<void>>('/auth/reset-password', payload),

  /**
   * Xác minh mã OTP quên mật khẩu (không thay đổi mật khẩu)
   */
  verifyResetOtp: (payload: VerifyResetOtpPayload) =>
    http.post<any, ApiResponse<void>>('/auth/verify-reset-otp', payload),

  /**
   * Đăng xuất hệ thống
   */
  logout: async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    await http.post('/auth/logout', { refreshToken })
  },

  /**
   * Đăng xuất người dùng khỏi tất cả thiết bị
   */
  logoutAllDevices: () =>
    http.post<any, ApiResponse<void>>('/auth/logout-all', {}),

  /**
   * Đăng nhập bằng Google OAuth2 ID Token
   */
  loginWithGoogle: async (token: string): Promise<AuthResponse> => {
    const response = await http.post<any, ApiResponse<LoginResponse>>('/auth/google', { token })
    const { accessToken, refreshToken, id, email, fullName, role, avatarUrl, accountStatus } = response.data
    return {
      accessToken,
      refreshToken,
      user: {
        id: String(id),
        email,
        name: fullName,
        role: role as Role,
        verified: accountStatus === 'ACTIVE',
        avatarUrl: avatarUrl || undefined
      }
    }
  },

  /**
   * Đăng ký tài khoản bằng Google OAuth2 ID Token cùng thông tin hồ sơ
   */
  registerWithGoogle: async (payload: GoogleRegisterPayload): Promise<AuthResponse> => {
    const response = await http.post<any, ApiResponse<LoginResponse>>('/auth/google/register', payload)
    const { accessToken, refreshToken, id, email, fullName, role, avatarUrl, accountStatus } = response.data
    return {
      accessToken,
      refreshToken,
      user: {
        id: String(id),
        email,
        name: fullName,
        role: role as Role,
        verified: accountStatus === 'ACTIVE',
        avatarUrl: avatarUrl || undefined
      }
    }
  },
}
