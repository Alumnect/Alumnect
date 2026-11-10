import { useQuery } from '@tanstack/react-query'
import { verificationApi } from '@/api/verification'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/store/authStore'

/**
 * Trạng thái phiếu nâng cấp Cựu sinh viên (UC08) của người dùng hiện tại.
 * Khi Admin đã duyệt (vai trò đổi sang ALUMNI) thì đồng bộ luôn vai trò vào authStore, giống bản Web.
 */
export function useMyVerification(enabled = true) {
  return useQuery({
    queryKey: ['verification', 'me'],
    enabled,
    queryFn: async () => {
      const data = (await verificationApi.myStatus()).data
      const me = useAuthStore.getState().user
      if (me && data?.currentRole && (me.role !== data.currentRole || me.verified !== data.isAccountVerified)) {
        useAuthStore.getState().setUser({ ...me, role: data.currentRole as Role, verified: data.isAccountVerified })
      }
      return data
    },
  })
}
