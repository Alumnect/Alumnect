import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, type Role } from '@/store/authStore'
import { userKeys } from '@/features/user/hooks/useUserQueries'
import { verificationApi } from '../api/verificationApi'
import type { SubmitVerificationPayload } from '../model/verificationTypes'

export const verificationKeys = {
  all: ['verification-request'] as const,
  myStatus: () => ['verification-request', 'me'] as const,
}

/**
 * Hook truy vấn trạng thái xác minh / nâng cấp Cựu sinh viên của người dùng hiện tại (UC08).
 * Tự động đồng bộ vai trò người dùng trong Zustand authStore khi hồ sơ đã được Admin duyệt lên ALUMNI.
 */
export function useMyVerificationStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: verificationKeys.myStatus(),
    queryFn: async () => {
      const response = await verificationApi.getMyStatus()
      const data = response.data
      if (data) {
        const currentUser = useAuthStore.getState().user
        if (
          currentUser &&
          data.currentRole &&
          (currentUser.role !== data.currentRole || currentUser.verified !== data.isAccountVerified)
        ) {
          useAuthStore.getState().setUser({
            ...currentUser,
            role: data.currentRole as Role,
            verified: data.isAccountVerified,
          })
        }
      }
      return data
    },
    ...options,
  })
}

/**
 * Hook gửi yêu cầu nâng cấp tài khoản từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI) (UC08).
 * Sau khi gửi thành công, tự động làm mới cache trạng thái xác minh và hồ sơ cá nhân.
 */
export function useSubmitAlumniUpgrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitVerificationPayload) =>
      verificationApi.submitUpgradeRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.ownProfile() })
    },
  })
}

