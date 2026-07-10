import { useQuery } from '@tanstack/react-query'
import { alumniMapApi } from '../api/alumniMapApi'
import type { AlumniMapFilters } from '../api/alumniMapApi'

/**
 * Custom hook lấy danh sách vị trí địa lý của cựu sinh viên từ API Backend.
 */
export function useAlumniMap(filters?: AlumniMapFilters) {
  return useQuery({
    queryKey: ['alumniMap', filters],
    queryFn: async () => {
      const response = await alumniMapApi.getLocations(filters)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 phút cache
  })
}
