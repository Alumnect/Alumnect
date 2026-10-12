import type { MentoringType, MentoringWorkingMode } from './mentorSearchTypes'

/**
 * Trạng thái hoạt động của hồ sơ Mentor.
 */
export type MentorStatusType = 'INCOMPLETE' | 'PAYMENT_PENDING' | 'ACTIVE' | 'EXPIRED'

/**
 * Thông tin học vấn chi tiết tại Đại học FPT.
 */
export interface MentorAcademicInfo {
  campus?: string | null
  majorName?: string | null
  majorCode?: string | null
  cohort?: number | null
  graduationYear?: number | null
}

/**
 * Lĩnh vực chuyên môn hỗ trợ của Mentor.
 */
export interface MentorSupportedFieldItem {
  id: number
  name: string
}

/**
 * Kỹ năng chuyên môn của Mentor theo nhóm.
 */
export interface MentorSkillItem {
  id: number
  skillName: string
  groupName: string
  sortOrder: number
}

/**
 * Mốc kinh nghiệm làm việc trên Career Timeline của Mentor.
 */
export interface MentorExperienceItem {
  id: number
  title: string
  company: string
  location?: string | null
  locationCity?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  isPrimary?: boolean
  description?: string | null
}

/**
 * Chi tiết toàn bộ hồ sơ Mentor trả về từ API (UC99).
 */
export interface MentorDetailData {
  mentorId: number
  userId: number
  fullName: string
  avatarUrl?: string | null
  headline?: string | null
  currentPosition?: string | null
  currentCompany?: string | null
  mentorStatus: MentorStatusType
  isVerifiedAlumni?: boolean
  canReceiveRequest: boolean
  availabilityReason?: string | null
  academicInfo?: MentorAcademicInfo | null
  bio?: string | null
  biography?: string | null
  city?: string | null
  workingMode?: MentoringWorkingMode | null
  mentoringType?: MentoringType | null
  supportedFields: MentorSupportedFieldItem[]
  topics: string[]
  skills: MentorSkillItem[]
  experiences: MentorExperienceItem[]
  reputationScore: number
  rating: number
  reviewCount: number
  completedTasks: number
}
