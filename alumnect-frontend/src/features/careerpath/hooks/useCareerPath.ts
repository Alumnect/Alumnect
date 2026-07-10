import { useQuery } from '@tanstack/react-query'
import { careerPathApi } from '../api/careerPathApi'
import type { CareerPathFilters } from '../api/careerPathApi'

/**
 * Hook truy vấn danh sách Career Paths phân trang có bộ lọc
 */
export function useCareerPaths(filters?: CareerPathFilters) {
  return useQuery({
    queryKey: ['career-paths', filters],
    queryFn: async () => {
      const response = await careerPathApi.getCareerPaths(filters)
      return response.data
    },
  })
}

/**
 * Hook truy vấn chi tiết lộ trình sự nghiệp (lazy load)
 */
export function useCareerPathDetail(userId: number | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['career-path-detail', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Yêu cầu ID cựu sinh viên hợp lệ')
      const response = await careerPathApi.getCareerPathDetail(userId)
      return response.data
    },
    enabled: (options?.enabled !== false) && !!userId && !isNaN(userId),
    staleTime: 1000 * 60 * 10, // Cache chi tiết 10 phút
  })
}
