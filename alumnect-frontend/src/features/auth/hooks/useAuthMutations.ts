import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '../api/authApi'
import type { AuthResponse } from '../api/authApi'
import type { GoogleRegisterPayload } from '../model/authTypes'
import type { LoginInput, ForgotInput } from '../model/schemas'

/** Đăng nhập — gọi API Spring Boot thực tế. */
export function useLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (input: LoginInput): Promise<AuthResponse> => authApi.login(input),
    onSuccess: (data) => {
      login(data)
      navigate('/app')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotInput) => authApi.forgotPassword(input),
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } catch {
        /* Bỏ qua lỗi mạng khi đăng xuất */
      }
    },
    onSuccess: () => {
      logout()
      navigate('/login')
    },
  })
}

/** Đăng nhập bằng Google ID Token */
export function useGoogleLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (token: string): Promise<AuthResponse> => authApi.loginWithGoogle(token),
    onSuccess: (data) => {
      login(data)
      navigate('/app')
    },
  })
}

/** Đăng ký bằng Google ID Token cùng hồ sơ sinh viên */
export function useGoogleRegister() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (payload: GoogleRegisterPayload): Promise<AuthResponse> => authApi.registerWithGoogle(payload),
    onSuccess: (data) => {
      if (data.accessToken) {
        login(data)
        navigate('/app')
      } else {
        navigate('/login', {
          state: {
            successMessage: 'Đăng ký thành công! Tài khoản cựu sinh viên của bạn đang chờ quản trị viên phê duyệt.',
          },
          replace: true,
        })
      }
    },
  })
}
