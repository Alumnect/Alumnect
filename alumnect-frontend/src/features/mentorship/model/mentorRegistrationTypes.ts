/**
 * Kiểu dữ liệu cho tính năng Đăng ký trở thành Mentor (UC91).
 */

export type MentoringWorkingMode = 'ONLINE' | 'OFFLINE' | 'BOTH'
export type MentoringType = 'INDIVIDUAL' | 'GROUP' | 'BOTH'
export type MentorStatus = 'INCOMPLETE' | 'PAYMENT_PENDING' | 'ACTIVE' | 'EXPIRED'

export interface PersonalInfo {
  fullName?: string | null
  avatarUrl?: string | null
  email: string
  phone?: string | null
  campus?: string | null
  majorName?: string | null
  graduationYear?: number | null
  studentCode?: string | null
}

export interface ReusedFromProfile {
  currentPosition?: string | null
  currentCompany?: string | null
  skills: string[]
}

export interface ProfessionalInfo {
  reusedFromProfile: ReusedFromProfile
  yearsOfExperience?: number | null
  bio?: string | null
}

export interface SupportedIndustryItem {
  id: number
  name: string
}

export interface MentoringInfo {
  workingMode?: MentoringWorkingMode | null
  mentoringType?: MentoringType | null
  supportedIndustries: SupportedIndustryItem[]
  mentoringTopics: string[]
}

export interface CvInfo {
  cvFileKey?: string | null
  cvDownloadUrl?: string | null
}

export interface PayoutAccountInfo {
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
}

export interface MentorRegistrationResponse {
  hasExistingRegistration: boolean
  mentorStatus: MentorStatus
  isComplete: boolean
  personalInfo: PersonalInfo
  professionalInfo: ProfessionalInfo
  mentoringInfo: MentoringInfo
  cvInfo: CvInfo
  payoutAccount: PayoutAccountInfo
  termsAccepted: boolean
  missingFields: string[]
}

export interface MentorRegistrationRequest {
  fullName?: string | null
  phone?: string | null
  campus?: string | null
  graduationYear?: number | null
  yearsOfExperience?: number | null
  bio?: string | null
  workingMode?: MentoringWorkingMode | null
  mentoringType?: MentoringType | null
  supportedIndustryIds?: number[]
  mentoringTopics?: string[]
  cvFileKey?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
}

export interface MentorRegistrationSaveResponse {
  mentorProfileId: number
  mentorStatus: MentorStatus
  isComplete: boolean
  nextStep: string
  missingFields: string[]
}
