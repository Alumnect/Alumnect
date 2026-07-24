export interface ChangePasswordPayload {
  oldPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

export interface MajorResponse {
  id: number
  code: string
  name: string
}
export interface ExperienceResponse {
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
  createdAt?: string
  updatedAt?: string
}

export interface ExperienceRequest {
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

export interface PromotionPayload {
  newTitle: string
  newStartDate: string
  description?: string | null
  reuseLocation: boolean
}

export interface PrimaryExperienceResponse {
  id: number
  title: string
  company: string
  location?: string | null
  locationCity?: string | null
  latitude?: number | null
  longitude?: number | null
}


export interface UserSkillResponse {
  id: number
  groupName: string
  skillName: string
  sortOrder: number
}

export interface UserProfileResponse {
  userId: number
  email: string
  role: string
  fullName: string
  avatarUrl: string
  phone: string
  major: MajorResponse | null
  cohort: number | null
  studentCode: string | null
  headline: string | null
  biography: string | null
  campus?: string | null
  graduationYear?: number | null
  city: string | null
  latitude: number | null
  longitude: number | null
  socialLinks?: string[]
  coverUrl?: string | null
  createdAt: string
  updatedAt: string
  accountStatus: string
  isAccountVerified: boolean
  primaryExperience?: PrimaryExperienceResponse | null
  experiences?: ExperienceResponse[]
  skills?: UserSkillResponse[]
}

export interface UserSkillRequest {
  groupName: string
  skillName: string
  sortOrder: number
}

export interface UpdateProfileRequest {
  fullName: string
  avatarUrl?: string | null
  coverUrl?: string | null
  phone?: string | null
  headline?: string | null
  biography?: string | null
  campus?: string | null
  cohort?: number | null
  majorId?: number | null
  graduationYear?: number | null
  city?: string | null
  socialLinks?: string[]
  skills?: UserSkillRequest[]
}

