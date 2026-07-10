import http from '@/lib/http'

export interface AlumniMapResponse {
  userId: number
  fullName: string
  avatarUrl: string
  verifiedStatus: boolean
  title: string
  company: string
  location: string
  latitude: number
  longitude: number
  startDate: string
  profileIdentifier: string
  cohort?: number | null
}

export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

export interface AlumniMapFilters {
  search?: string
  title?: string
  company?: string
  location?: string
  cohort?: number
  majorId?: number
}

export const alumniMapApi = {
  /**
   * Lấy danh sách vị trí tọa độ địa lý và thông tin tóm tắt của cựu sinh viên hoạt động với các bộ lọc
   */
  getLocations: (filters?: AlumniMapFilters) =>
    http.get<any, ApiResponse<AlumniMapResponse[]>>('/alumni-map', { params: filters }),
}
