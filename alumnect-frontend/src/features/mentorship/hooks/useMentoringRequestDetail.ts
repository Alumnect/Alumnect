import { useQuery } from '@tanstack/react-query'
import { mentoringRequestApi } from '../api/mentoringRequestApi'

/**
 * Custom hook truy xuất thông tin chi tiết một yêu cầu Mentoring kèm danh sách phản hồi từ Mentor (UC102).
 * Sử dụng TanStack Query với query key ['mentoring', 'requests', id].
 *
 * @param id Định danh số của yêu cầu Mentoring
 * @param enabled Điều kiện kích hoạt query (mặc định bật khi id hợp lệ)
 */
export function useMentoringRequestDetail(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['mentoring', 'requests', id],
    queryFn: () => {
      if (!id) throw new Error('Mã yêu cầu cố vấn không hợp lệ')
      return mentoringRequestApi.getRequestDetail(id)
    },
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 30, // 30 giây
    retry: 1,
  })
}
