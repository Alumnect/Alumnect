import { useQuery } from '@tanstack/react-query'
import { mentoringRequestApi } from '../api/mentoringRequestApi'

export interface UseMyMentoringRequestsOptions {
  page?: number
  size?: number
  enabled?: boolean
}

/**
 * Custom hook truy xuất danh sách yêu cầu Mentoring của sinh viên đang đăng nhập (UC102).
 * Hỗ trợ linh hoạt cả truyền options object hoặc tham số phân trang rời:
 * useMyMentoringRequests({ page: 0, size: 10 }) hoặc useMyMentoringRequests(0, 10).
 */
export function useMyMentoringRequests(
  pageOrOptions?: number | UseMyMentoringRequestsOptions,
  sizeArg = 10,
) {
  let page = 0
  let size = sizeArg
  let enabled = true

  if (pageOrOptions && typeof pageOrOptions === 'object') {
    page = pageOrOptions.page ?? 0
    size = pageOrOptions.size ?? 10
    enabled = pageOrOptions.enabled ?? true
  } else if (typeof pageOrOptions === 'number') {
    page = pageOrOptions
    size = sizeArg
  }

  return useQuery({
    queryKey: ['mentoring', 'requests', 'my', page, size],
    queryFn: () => mentoringRequestApi.getMyRequests(page, size),
    enabled,
    staleTime: 1000 * 30, // 30 giây
  })
}
