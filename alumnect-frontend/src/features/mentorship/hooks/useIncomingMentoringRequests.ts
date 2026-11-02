import { useQuery } from '@tanstack/react-query'
import { mentoringRequestApi } from '../api/mentoringRequestApi'

export interface UseIncomingMentoringRequestsOptions {
  status?: string
  requestType?: string
  scope?: 'ALL' | 'SAME_INDUSTRY' | 'SAME_FORMAT'
  page?: number
  size?: number
  enabled?: boolean
}

/**
 * Custom hook truy xuất danh sách yêu cầu Mentoring gửi đến Mentor đang đăng nhập (UC103).
 * Hỗ trợ phân trang và lọc theo trạng thái (status) hoặc loại yêu cầu (requestType).
 */
export function useIncomingMentoringRequests(options?: UseIncomingMentoringRequestsOptions) {
  const status = options?.status
  const requestType = options?.requestType
  const scope = options?.scope
  const page = options?.page ?? 0
  const size = options?.size ?? 10
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: ['mentoring', 'incoming-requests', { status, requestType, scope, page, size }],
    queryFn: () =>
      mentoringRequestApi.getIncomingRequests({
        status,
        requestType,
        scope,
        page,
        size,
      }),
    enabled,
    staleTime: 1000 * 30, // 30 giây cache
  })
}
