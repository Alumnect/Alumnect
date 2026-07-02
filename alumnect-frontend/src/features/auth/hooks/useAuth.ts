import { useQuery, useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import type { RegisterPayload } from '../model/authTypes'

/**
 * Custom hook lấy danh sách chuyên ngành
 */
export function useMajors() {
  return useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await authApi.getMajors()
      return response.data
    },
    staleTime: 1000 * 60 * 30, // 30 phút cache
  })
}

/**
 * Custom hook đăng ký tài khoản mới
 */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  })
}

/**
 * Custom hook xác thực email qua OTP
 */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: ({ email, token }: { email: string; token: string }) => 
      authApi.verifyEmail(email, token),
  })
}

/**
 * Custom hook gửi lại mã OTP
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendOtp(email),
  })
}

/**
 * Custom hook sinh link ký sẵn (Presigned URL)
 */
export function usePresignedUrl() {
  return useMutation({
    mutationFn: ({ fileName, contentType, folder }: { fileName: string; contentType: string; folder?: string }) => 
      authApi.getPresignedUrl(fileName, contentType, folder),
  })
}
