import http from '@/lib/http'
import type { AuthUser } from '@/store/authStore'
import type { LoginInput, RegisterInput, ForgotInput } from '../model/schemas'

export type AuthResponse = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

/** Auth endpoints (Spring Boot `/api/v1/auth/*`). http unwraps `response.data`. */
export const authApi = {
  login: async (input: LoginInput) =>
    (await http.post('/auth/login', input)) as unknown as AuthResponse,
  register: async (input: RegisterInput) =>
    (await http.post('/auth/register', input)) as unknown as { message: string },
  forgotPassword: async (input: ForgotInput) =>
    (await http.post('/auth/forgot-password', input)) as unknown as { message: string },
  logout: async () => {
    await http.post('/auth/logout')
  },
}
