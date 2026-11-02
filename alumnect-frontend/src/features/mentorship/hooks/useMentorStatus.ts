import { useQuery } from '@tanstack/react-query'
import { mentorStatusApi } from '../api/mentorStatusApi'

/** Key cache cho React Query */
export const MENTOR_STATUS_KEYS = {
  status: ['mentor-status'] as const,
}

/**
 * Custom Hook truy vấn trạng thái tổng hợp của Mentor & Subscription (UC94).
 * Sử dụng React Query để tự động caching và đồng bộ dữ liệu.
 *
 * @param enabled Điều kiện cho phép kích hoạt query (mặc định true)
 * @returns Query object chứa data, isLoading, error, refetch...
 */
export function useMentorStatus(enabled = true) {
  return useQuery({
    queryKey: MENTOR_STATUS_KEYS.status,
    queryFn: mentorStatusApi.getMentorStatus,
    enabled,
    staleTime: 30 * 1000, // Cân bằng giữa cache và độ tươi mới (30s)
    refetchOnWindowFocus: true,
  })
}
