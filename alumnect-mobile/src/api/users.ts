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
  skills?: { id: number; groupName: string; skillName: string }[]
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

export interface UpdateProfileRequest {
  fullName: string
  avatarUrl?: string | null
  phone?: string | null
  headline?: string | null
  biography?: string | null
  city?: string | null
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
  search: (params: { query?: string; role?: string; majorId?: number; cohort?: number; city?: string; page?: number; size?: number }) =>
    http.get<unknown, ApiResponse<PageResponse<UserCard>>>('/users/search', { params: { size: 20, ...params } }),
  suggestions: (limit = 10) => http.get<unknown, ApiResponse<UserCard[]>>('/users/suggestions', { params: { limit } }),
}
