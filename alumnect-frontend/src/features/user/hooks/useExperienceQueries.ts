import { useQuery } from '@tanstack/react-query'
import { experienceApi } from '../api/experienceApi'

/**
 * Hook truy vấn danh sách kinh nghiệm làm việc của chính mình
 */
export function useExperiences(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const response = await experienceApi.getExperiences()
      return response.data
    },
    ...options,
  })
}
