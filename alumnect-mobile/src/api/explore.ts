import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'

export interface MapPoint {
  userId: number
  majorId?: number | null
  fullName: string
  avatarUrl: string
  verifiedStatus: boolean
  title: string
  company: string
  location: string
  latitude: number
  longitude: number
  cohort?: number | null
}

export interface CareerSummary {
  userId: number
  fullName: string
  avatarUrl: string
  verifiedStatus: boolean
  cohort?: number | null
  major?: string | null
  currentTitle?: string | null
  currentCompany?: string | null
  currentLocation?: string | null
  careerPreview: { experienceId: number; title: string; company: string; startDate: string; endDate?: string | null; isCurrent: boolean }[]
  totalExperiences: number
}

export interface CareerDetail {
  userId: number
  fullName: string
  avatarUrl: string
  experiences: { id: number; title: string; company: string; location?: string | null; startDate: string; endDate?: string | null; isCurrent: boolean; isPrimary: boolean; description?: string | null }[]
}

export interface Experience {
  id: number
  title: string
  company: string
  location?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  isPrimary: boolean
  description?: string | null
}
export interface ExperienceRequest {
  title: string
  company: string
  location?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  isPrimary: boolean
  description?: string | null
}

export const exploreApi = {
  map: (f: { search?: string; cohort?: number; majorId?: number }) =>
    http.get<unknown, ApiResponse<MapPoint[]>>('/alumni-map', { params: f }).then((r) => r.data ?? []),
  careerPaths: (f: { search?: string; title?: string; company?: string; location?: string; cohort?: number; majorId?: number; page?: number }) =>
    http.get<unknown, ApiResponse<PageResponse<CareerSummary>>>('/career-paths', { params: { size: 10, ...f } }).then((r) => r.data),
  careerDetail: (userId: number) => http.get<unknown, ApiResponse<CareerDetail>>(`/career-paths/users/${userId}`).then((r) => r.data),
}

export const experienceApi = {
  list: () => http.get<unknown, ApiResponse<Experience[]>>('/experiences').then((r) => r.data ?? []),
  create: (p: ExperienceRequest) => http.post<unknown, ApiResponse<Experience>>('/experiences', p).then((r) => r.data),
  update: (id: number, p: ExperienceRequest) => http.put<unknown, ApiResponse<Experience>>(`/experiences/${id}`, p).then((r) => r.data),
  remove: (id: number) => http.delete(`/experiences/${id}`),
  promote: (id: number, p: { newTitle: string; newStartDate: string; description?: string | null; reuseLocation: boolean }) =>
    http.post<unknown, ApiResponse<Experience>>(`/experiences/${id}/promote`, p).then((r) => r.data),
}
