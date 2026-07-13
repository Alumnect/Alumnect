import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from './adminApi'

/**
 * Hook lấy dữ liệu dashboard KPIs và thống kê đăng ký
 */
export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const response = await adminApi.getDashboardSummary()
      return response.data
    },
    staleTime: 1000 * 30, // 30s cache
  })
}

/**
 * Hook lấy danh sách tài khoản theo bộ lọc và phân trang
 */
export function useAdminUsers(filters: {
  query?: string
  role?: string
  status?: string
  majorId?: number | string
  cohort?: number | string
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const response = await adminApi.getUsers(filters)
      return response.data
    },
  })
}

/**
 * Hook lấy chi tiết một tài khoản người dùng
 */
export function useAdminUserDetail(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: async () => {
      if (!id) return null
      const response = await adminApi.getUserDetail(id)
      return response.data
    },
    enabled: id !== null,
  })
}

/**
 * Hook cập nhật trạng thái tài khoản (Khóa/Mở khóa)
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'ACTIVE' | 'LOCKED' }) => {
      const response = await adminApi.updateUserStatus(id, status)
      return response.data
    },
    onSuccess: (_, variables) => {
      // Refresh danh sách người dùng và chi tiết người dùng
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

/**
 * Hook lấy danh sách yêu cầu xác thực cựu sinh viên
 */
export function useAdminVerifications(params: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'verifications', params],
    queryFn: async () => {
      const response = await adminApi.getVerificationRequests(params)
      return response.data
    },
  })
}

/**
 * Hook phê duyệt hoặc từ chối yêu cầu xác thực tốt nghiệp
 */
export function useReviewVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
    }: {
      id: number
      status: 'APPROVED' | 'REJECTED'
      reviewNote?: string
    }) => {
      const response = await adminApi.reviewVerificationRequest(id, { status, reviewNote })
      return response.data
    },
    onSuccess: () => {
      // Refresh các danh sách liên quan và thống kê
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
