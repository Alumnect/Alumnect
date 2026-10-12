import type { MentoringWorkingMode, MentoringType } from './mentorRegistrationTypes'
export type { MentoringWorkingMode, MentoringType }

/**
 * Cấu trúc đối tượng lĩnh vực hỗ trợ (SupportedFieldItem) từ Backend.
 */
export interface SupportedFieldItem {
  id: number
  name: string
}

/**
 * Dữ liệu thẻ tóm tắt Mentor (UC98).
 * Khớp 100% với DTO MentorCardResponse của Backend.
 */
export interface MentorCardData {
  mentorId: number
  userId: number
  fullName: string
  avatarUrl: string | null
  headline: string | null
  bio: string | null
  currentCompany: string | null
  currentPosition: string | null
  majorId: number | null
  majorName: string | null
  majorCode: string | null
  specialization?: string | null
  workingMode: MentoringWorkingMode
  mentoringType: MentoringType
  minHourlyRate: number | null
  maxHourlyRate: number | null
  rating: number
  reviewCount: number
  reputationScore: number
  completedMissions?: number
  completedTasks?: number
  supportedFields: (SupportedFieldItem | string)[]
  skills: (string | { id?: number; name?: string })[]
  topics: (string | { id?: number; name?: string })[]
  active: boolean
}

/**
 * Tham số tìm kiếm và lọc Mentor (UC98).
 * Khớp với query parameters của GET /api/v1/mentors.
 */
export interface MentorSearchParams {
  keyword?: string
  fieldId?: number
  industryName?: string
  majorId?: number
  specialization?: string
  skill?: string
  workingMode?: MentoringWorkingMode
  mentoringType?: MentoringType
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/**
 * Cấu trúc phân trang danh sách Mentor trả về từ Backend.
 */
export interface MentorSearchPageResponse {
  content: MentorCardData[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

/**
 * Mục lựa chọn cho dropdown.
 */
export interface OptionItem {
  id: number
  name: string
  code?: string
}

/**
 * Mục lựa chọn Enum cho dropdown.
 */
export interface EnumOptionItem {
  value: string
  label: string
}

/**
 * Metadata danh sách bộ lọc hỗ trợ phía Client.
 * Khớp với MentorFilterOptionsResponse từ GET /api/v1/mentors/filter-options.
 */
export interface MentorFilterOptions {
  industries: OptionItem[]
  majors?: OptionItem[]
  specializations?: OptionItem[]
  skills?: string[]
  popularSkills?: string[]
  workingModes?: EnumOptionItem[]
  mentoringTypes?: EnumOptionItem[]
}
