import http from '@/lib/http'
import type { ApiResponse } from '@/lib/http'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser, Role } from '@/store/authStore'

export interface Major {
  id: number
  code: string
  name: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  role: 'STUDENT' | 'ALUMNI'
  majorId: number
  studentCode: string
  proofUrl?: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  id: number
  email: string
  role: string
  fullName: string
  avatarUrl?: string
  accountStatus: string
}

export interface GoogleRegisterPayload {
  token: string
  fullName: string
  role: 'STUDENT' | 'ALUMNI'
  majorId: number
  studentCode: string
  proofUrl?: string
}

export type AuthResponse = { user: AuthUser; accessToken: string; refreshToken: string }

const toAuth = (d: LoginResponse): AuthResponse => ({
  accessToken: d.accessToken,
  refreshToken: d.refreshToken,
  user: {
    id: String(d.id),
    email: d.email,
    name: d.fullName,
    role: d.role as Role,
    verified: d.accountStatus === 'ACTIVE',
    avatarUrl: d.avatarUrl || undefined,
  },
})

export const authApi = {
  getMajors: () => http.get<unknown, ApiResponse<Major[]>>('/majors'),
  register: (p: RegisterPayload) => http.post<unknown, ApiResponse<void>>('/auth/register', p),
  verifyEmail: (email: string, token: string) =>
    http.get<unknown, ApiResponse<void>>('/auth/verify-email', { params: { email, token } }),
  resendOtp: (email: string) => http.post<unknown, ApiResponse<void>>('/auth/resend-otp', null, { params: { email } }),
  login: async (input: { email: string; password: string }) => {
    const res = await http.post<unknown, ApiResponse<LoginResponse>>('/auth/login', input)
    return toAuth(res.data)
  },
  loginWithGoogle: async (token: string) => {
    const res = await http.post<unknown, ApiResponse<LoginResponse>>('/auth/google', { token })
    return toAuth(res.data)
  },
  registerWithGoogle: async (p: GoogleRegisterPayload) => {
    const res = await http.post<unknown, ApiResponse<LoginResponse>>('/auth/google/register', p)
    return toAuth(res.data)
  },
  /** Thu hồi một refresh token trên server (dùng khi từ chối phiên Admin trên mobile). */
  revokeSession: (refreshToken?: string | null) =>
    refreshToken ? http.post('/auth/logout', { refreshToken }).catch(() => undefined) : Promise.resolve(),
  forgotPassword: (input: { email: string }) => http.post<unknown, ApiResponse<void>>('/auth/forgot-password', input),
  verifyResetOtp: (p: { email: string; token: string }) =>
    http.post<unknown, ApiResponse<void>>('/auth/verify-reset-otp', p),
  resetPassword: (p: { email: string; token: string; newPassword: string }) =>
    http.post<unknown, ApiResponse<void>>('/auth/reset-password', p),
  logout: async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    await http.post('/auth/logout', { refreshToken })
  },
  logoutAll: () => http.post<unknown, ApiResponse<void>>('/auth/logout-all', {}),
  changePassword: (p: { oldPassword: string; newPassword: string; confirmNewPassword: string }) =>
    http.post<unknown, ApiResponse<void>>('/users/change-password', p),
}
