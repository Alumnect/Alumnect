import { useQuery } from '@tanstack/react-query'
import { mentorRankingApi } from '../api/mentorRankingApi'
import type {
  MentorRankingPageResponse,
  MentorRankingParams,
} from '../model/mentorRankingTypes'

/**
 * Hàm sinh query key duy nhất cho bảng xếp hạng Mentor theo lĩnh vực và phân trang.
 */
export const mentorRankingQueryKey = (params: MentorRankingParams) => [
  'mentoring',
  'ranking',
  params.fieldId,
  params.page ?? 0,
  params.size ?? 10,
] as const

/**
 * Hook truy vấn bảng xếp hạng Mentor theo từng lĩnh vực chuyên môn (UC97).
 * Tự động vô hiệu hóa nếu chưa chọn fieldId hợp lệ.
 *
 * @param params Tham số fieldId, page, size
 * @param enabled Điều kiện bổ sung kích hoạt truy vấn
 */
export function useMentorRanking(params: MentorRankingParams, enabled = true) {
  const isFieldValid = Boolean(params.fieldId && params.fieldId > 0)

  return useQuery<MentorRankingPageResponse, Error>({
    queryKey: mentorRankingQueryKey(params),
    queryFn: () => mentorRankingApi.getRanking(params),
    enabled: isFieldValid && enabled,
    staleTime: 1000 * 60 * 2, // Cache dữ liệu trong 2 phút
    placeholderData: (previousData) => previousData, // Giữ lại dữ liệu cũ khi đổi trang mượt mà
  })
}
