import { useQuery } from '@tanstack/react-query'
import { mentorSearchApi } from '../api/mentorSearchApi'
import type {
  MentorFilterOptions,
  MentorSearchPageResponse,
  MentorSearchParams,
} from '../model/mentorSearchTypes'

/**
 * Hàm sinh query key cho tính năng Tìm kiếm & lọc Mentor (UC98).
 * Bao quát toàn bộ tham số tìm kiếm, bộ lọc và phân trang.
 */
export const mentorSearchQueryKey = (params: MentorSearchParams) => [
  'mentors',
  'search',
  {
    keyword: params.keyword ?? '',
    fieldId: params.fieldId ?? null,
    industryName: params.industryName ?? '',
    majorId: params.majorId ?? null,
    specialization: params.specialization ?? '',
    skill: params.skill ?? '',
    workingMode: params.workingMode ?? null,
    mentoringType: params.mentoringType ?? null,
    page: params.page ?? 0,
    size: params.size ?? 9,
    sortBy: params.sortBy ?? 'reputationScore',
    sortDir: params.sortDir ?? 'desc',
  },
] as const

/**
 * Query key cho danh sách tùy chọn bộ lọc.
 */
export const mentorFilterOptionsQueryKey = ['mentors', 'filter-options'] as const

/**
 * Hook truy vấn tìm kiếm và lọc Mentor (UC98).
 *
 * @param params Tham số tìm kiếm và lọc
 * @param enabled Điều kiện bổ sung kích hoạt truy vấn
 */
export function useMentorSearch(params: MentorSearchParams, enabled = true) {
  return useQuery<MentorSearchPageResponse, Error>({
    queryKey: mentorSearchQueryKey(params),
    queryFn: () => mentorSearchApi.searchMentors(params),
    enabled,
    staleTime: 1000 * 60 * 2, // Cache 2 phút
    placeholderData: (previousData) => previousData, // Giữ lại trang cũ khi chuyển trang hoặc đổi filter để tránh chớp giật layout
  })
}

/**
 * Hook lấy danh mục tùy chọn bộ lọc từ Backend (lĩnh vực, ngành, kỹ năng, hình thức).
 */
export function useMentorFilterOptions() {
  return useQuery<MentorFilterOptions, Error>({
    queryKey: mentorFilterOptionsQueryKey,
    queryFn: () => mentorSearchApi.getFilterOptions(),
    staleTime: 1000 * 60 * 10, // Cache 10 phút vì danh mục ít biến động
  })
}
