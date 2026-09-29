import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentoringTermsApi } from '../api/mentoringTermsApi'
import type { MentoringTermsStatus, MentoringTermsAcceptResult } from '../model/mentoringTermsTypes'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

/** Khóa định danh cache cho trạng thái điều khoản Mentoring */
export const MENTORING_TERMS_QUERY_KEY = ['mentoring', 'terms', 'status'] as const

/**
 * Custom hook lấy trạng thái chấp nhận điều khoản Hướng dẫn & Hỗ trợ.
 * Sử dụng TanStack Query để quản lý server state, không phụ thuộc vào localStorage.
 *
 * @param enabled Có kích hoạt query hay không (mặc định chỉ gọi khi đã xác thực đăng nhập)
 */
export function useMentoringTermsStatus(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<MentoringTermsStatus, Error>({
    queryKey: MENTORING_TERMS_QUERY_KEY,
    queryFn: () => mentoringTermsApi.getStatus(),
    enabled: isAuthenticated && enabled,
    staleTime: 1000 * 60 * 5, // Cache trong 5 phút
    retry: 1,
  })
}

/**
 * Custom hook thực hiện gửi yêu cầu chấp nhận điều khoản phiên bản hiện tại.
 * Sau khi chấp nhận thành công, tự động cập nhật cache và invalidate query để UI đồng bộ tức thì.
 */
export function useAcceptMentoringTerms() {
  const queryClient = useQueryClient()

  return useMutation<MentoringTermsAcceptResult, Error, void>({
    mutationFn: () => mentoringTermsApi.acceptTerms(),
    onSuccess: (data) => {
      // Cập nhật trực tiếp dữ liệu cache an toàn
      queryClient.setQueryData<MentoringTermsStatus>(MENTORING_TERMS_QUERY_KEY, (old) => {
        if (!old) {
          return {
            currentVersion: data.acceptedVersion,
            accepted: true,
            acceptedAt: data.acceptedAt,
          }
        }
        return {
          ...old,
          currentVersion: data.acceptedVersion,
          accepted: true,
          acceptedAt: data.acceptedAt,
        }
      })
      // Đồng thời làm mới cache trên server
      queryClient.invalidateQueries({ queryKey: MENTORING_TERMS_QUERY_KEY })
      toast.success('Chấp nhận điều khoản thành công!')
    },
    onError: (err) => {
      const message = err.message || 'Không thể chấp nhận điều khoản. Vui lòng thử lại.'
      toast.error(message)
    },
  })
}
