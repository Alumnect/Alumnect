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
  description?: string | null
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
  city: string | null
  latitude: number | null
  longitude: number | null
  socialLinks?: string[]
  coverUrl?: string | null
  createdAt: string
  updatedAt: string
  accountStatus: string
  isAccountVerified: boolean
  experiences?: ExperienceResponse[]
  skills?: UserSkillResponse[]
}

