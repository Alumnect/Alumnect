import { useQuery } from '@tanstack/react-query'
import { mentorDetailApi } from '../api/mentorDetailApi'
import type { MentorDetailData } from '../model/mentorDetailTypes'

/**
 * Hàm sinh query key duy nhất cho chi tiết một Mentor.
 * Đảm bảo cô lập cache giữa các Mentor khác nhau khi chuyển đổi URL.
 */
export const mentorDetailQueryKey = (mentorId: number | string | undefined | null) => [
  'mentoring',
  'mentor-detail',
  mentorId ? String(mentorId) : '',
] as const

/**
 * Hook truy vấn thông tin chi tiết của một Mentor (UC99 — View Mentor Detail).
 * Chỉ kích hoạt khi định danh mentorId hợp lệ.
 *
 * @param mentorId ID hồ sơ Mentor hoặc ID tài khoản
 * @param enabled Điều kiện bổ sung để bật/tắt query
 */
export function useMentorDetail(mentorId: number | string | undefined | null, enabled = true) {
  const isValidId = Boolean(
    mentorId && (typeof mentorId === 'number' ? mentorId > 0 : mentorId.trim().length > 0),
  )

  return useQuery<MentorDetailData, Error>({
    queryKey: mentorDetailQueryKey(mentorId),
    queryFn: () => mentorDetailApi.getMentorDetail(mentorId!),
    enabled: isValidId && enabled,
    staleTime: 1000 * 60 * 3, // Cache 3 phút
    retry: (failureCount, error: any) => {
      // Không retry nếu lỗi 404 hoặc 400
      if (error?.status === 404 || error?.status === 400 || error?.message?.includes('404')) {
        return false
      }
      return failureCount < 2
    },
  })
}
