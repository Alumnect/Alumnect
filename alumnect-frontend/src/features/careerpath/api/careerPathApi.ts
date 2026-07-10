import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'

export interface CareerPreviewItem {
  experienceId: number
  title: string
  company: string
  startDate: string
  endDate?: string | null
  isCurrent: boolean
}

export interface CareerPathSummaryResponse {
  userId: number
  fullName: string
  avatarUrl: string
  verifiedStatus: boolean
  cohort?: number | null
  major?: string | null
  currentTitle?: string | null
  currentCompany?: string | null
  currentLocation?: string | null
  careerPreview: CareerPreviewItem[]
  totalExperiences: number
}

export interface ExperienceTimelineResponse {
  id: number
  title: string
  company: string
  location?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  isPrimary: boolean
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
  locationCity?: string | null
  locationCountry?: string | null
  locationCountryCode?: string | null
  geocodingProvider?: string | null
  description?: string | null
}

export interface CareerPathDetailResponse {
  userId: number
  fullName: string
  avatarUrl: string
  experiences: ExperienceTimelineResponse[]
}

export interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface CareerPathFilters {
  search?: string
  title?: string
  company?: string
  location?: string
  cohort?: number
  majorId?: number
  page?: number
  size?: number
}

export const careerPathApi = {
  /**
   * Lấy danh sách Career Paths phân trang và có bộ lọc
   */
  getCareerPaths: (filters?: CareerPathFilters) =>
    http.get<any, ApiResponse<PageResponse<CareerPathSummaryResponse>>>('/career-paths', { params: filters }),

  /**
   * Lấy thông tin chi tiết lộ trình sự nghiệp của 1 cựu sinh viên
   */
  getCareerPathDetail: (userId: number) =>
    http.get<any, ApiResponse<CareerPathDetailResponse>>(`/career-paths/users/${userId}`),
}
