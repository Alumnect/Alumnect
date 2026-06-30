import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AUTH_ENFORCED, DEMO_USER } from '@/config/auth'
import { authApi } from '../api/authApi'
import type { AuthResponse } from '../api/authApi'
import type { LoginInput, RegisterInput, ForgotInput } from '../model/schemas'

/** Sign in — real API when enforced, otherwise a local demo session. */
export function useLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthResponse> => {
      if (!AUTH_ENFORCED) {
        return {
          user: { ...DEMO_USER, email: input.email || DEMO_USER.email },
          accessToken: 'demo-access',
          refreshToken: 'demo-refresh',
        }
      }
      return authApi.login(input)
    },
    onSuccess: (data) => {
      login(data)
      navigate('/app')
    },
  })
}

/** Register — real API when enforced; demo just routes to sign-in. */
export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      if (!AUTH_ENFORCED) return { message: 'demo' }
      return authApi.register(input)
    },
    onSuccess: () => navigate('/login'),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: ForgotInput) => {
      if (!AUTH_ENFORCED) return { message: 'demo' }
      return authApi.forgotPassword(input)
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: async () => {
      if (AUTH_ENFORCED) {
        try {
          await authApi.logout()
        } catch {
          /* ignore network errors on logout */
        }
      }
    },
    onSuccess: () => {
      logout()
      navigate('/login')
    },
  })
}
