import { useQuery } from '@tanstack/react-query'
import { alumniMapApi } from '../api/alumniMapApi'

/**
 * Custom hook lấy danh sách vị trí địa lý của cựu sinh viên từ API Backend.
 * Dữ liệu được quản lý và cache bởi React Query với thời gian sống (staleTime) là 5 phút.
 *
 * @returns Đối tượng useQuery chứa trạng thái dữ liệu (data), tải (isLoading), lỗi (error)
 */
export function useAlumniMap() {
  return useQuery({
    queryKey: ['alumniMap'],
    queryFn: async () => {
      const response = await alumniMapApi.getLocations()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 phút cache
  })
}
