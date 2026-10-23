import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'

export interface Major { id: number; code: string; name: string }

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

export interface UserProfile {
  userId: number
  email: string
  role: string
  fullName: string
  avatarUrl: string
  phone: string
  major: Major | null
  cohort: number | null
  studentCode: string | null
  headline: string | null
  biography: string | null
  campus?: string | null
  graduationYear?: number | null
  city: string | null
  coverUrl?: string | null
  isAccountVerified: boolean
  primaryExperience?: { id: number; title: string; company: string } | null
  experiences?: Experience[]
  skills?: { id: number; groupName: string; skillName: string; sortOrder?: number }[]
  socialLinks?: string[] | null
  followersCount?: number
  followingCount?: number
  isFollowing?: boolean
}

export interface UserCard {
  userId: number
  fullName: string
  avatarUrl: string | null
  headline: string | null
  role?: string
  major?: Major | null
  cohort?: number | null
  city?: string | null
  isFollowing?: boolean
  isAccountVerified?: boolean
  suggestionReason?: string
}

export interface UserSkillRequest { groupName: string; skillName: string; sortOrder: number }

/**
 * Backend ghi đè toàn bộ hồ sơ (trường nào gửi null sẽ bị xoá), nên luôn gửi đủ mọi trường
 * như Web (EditProfileView), kể cả những trường màn hình không sửa.
 */
export interface UpdateProfileRequest {
  fullName: string
  avatarUrl: string | null
  coverUrl: string | null
  phone: string | null
  headline: string | null
  biography: string | null
  campus: string | null
  cohort: number | null
  majorId: number | null
  graduationYear: number | null
  city: string | null
  socialLinks: string[]
  skills: UserSkillRequest[]
}

export interface UserSearchParams {
  query?: string
  role?: string
  majorId?: number
  cohort?: number
  city?: string
  skill?: string
  company?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export const userApi = {
  me: () => http.get<unknown, ApiResponse<UserProfile>>('/users/profile'),
  profile: (id: number | string) => http.get<unknown, ApiResponse<UserProfile>>(`/users/profile/${id}`),
  update: (p: UpdateProfileRequest) => http.put<unknown, ApiResponse<UserProfile>>('/users/profile', p),
  follow: (id: number) => http.post<unknown, ApiResponse<void>>(`/users/${id}/follow`),
  unfollow: (id: number) => http.delete<unknown, ApiResponse<void>>(`/users/${id}/follow`),
  followers: (id: number | string, page = 0) =>
    http.get<unknown, ApiResponse<PageResponse<UserCard>>>(`/users/${id}/followers`, { params: { page, size: 20 } }),
  following: (id: number | string, page = 0) =>
    http.get<unknown, ApiResponse<PageResponse<UserCard>>>(`/users/${id}/following`, { params: { page, size: 20 } }),
  search: (params: UserSearchParams) =>
    http.get<unknown, ApiResponse<PageResponse<UserCard>>>('/users/search', { params: { size: 20, ...params } }),
  /** Danh sách khóa và thành phố có dữ liệu thật, dùng cho bộ lọc (giống Web). */
  filterOptions: () => http.get<unknown, ApiResponse<{ cohorts?: number[]; cities?: string[] }>>('/users/filter-options').then((r) => r.data ?? {}),
  suggestions: (limit = 10) => http.get<unknown, ApiResponse<UserCard[]>>('/users/suggestions', { params: { limit } }),
}
