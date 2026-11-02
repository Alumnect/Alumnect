import { useQuery } from '@tanstack/react-query'
import { mentoringRequestApi } from '../api/mentoringRequestApi'

/**
 * Custom hook truy xuất chi tiết một yêu cầu Mentoring gửi đến Mentor kèm cờ quyền hành động (UC103).
 *
 * @param requestId ID của yêu cầu Mentoring
 */
export function useIncomingMentoringRequestDetail(requestId?: number) {
  return useQuery({
    queryKey: ['mentoring', 'incoming-requests', 'detail', requestId],
    queryFn: () => mentoringRequestApi.getIncomingRequestDetail(requestId!),
    enabled: !!requestId,
    staleTime: 1000 * 30, // 30 giây
  })
}
