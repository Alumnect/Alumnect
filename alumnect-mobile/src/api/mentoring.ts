import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'

export type WorkingMode = 'ONLINE' | 'OFFLINE' | 'BOTH'
export type MentoringType = 'INDIVIDUAL' | 'GROUP' | 'BOTH'
export type MentorStatus = 'INCOMPLETE' | 'PAYMENT_PENDING' | 'ACTIVE' | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export const WORKING_MODE_LABEL: Record<string, string> = { ONLINE: 'Trực tuyến', OFFLINE: 'Trực tiếp', BOTH: 'Cả hai' }
export const MENTORING_TYPE_LABEL: Record<string, string> = { INDIVIDUAL: '1-1', GROUP: 'Nhóm', BOTH: 'Cả hai' }
export const formatVnd = (n?: number | null) => `${new Intl.NumberFormat('vi-VN').format(Math.round(n ?? 0))} ₫`

export interface TermsStatus { currentVersion: string; accepted: boolean; acceptedAt?: string | null }

export interface MentorStatusResponse {
  mentorStatus: MentorStatus
  active: boolean
  statusMessage: string
  hasMentorProfile: boolean
  profileComplete: boolean
  missingProfileFields: string[]
  hasCv: boolean
  bankInformationComplete: boolean
  termsAccepted: boolean
  hasSubscription: boolean
  subscriptionStatus?: string | null
  packageName?: string | null
  endDate?: string | null
  remainingDays?: number | null
  pendingPaymentOrderCode?: number | null
  missingRequirements: string[]
  nextAction: string
}

export interface MentorCard {
  mentorId: number
  userId: number
  fullName: string
  avatarUrl: string | null
  headline: string | null
  currentCompany: string | null
  currentPosition: string | null
  majorName: string | null
  workingMode: WorkingMode
  mentoringType: MentoringType
  minHourlyRate: number | null
  maxHourlyRate: number | null
  rating: number
  reviewCount: number
  reputationScore: number
  supportedFields: ({ id: number; name: string } | string)[]
  active: boolean
}

export interface MentorDetail {
  mentorId: number
  userId: number
  fullName: string
  avatarUrl?: string | null
  headline?: string | null
  currentPosition?: string | null
  currentCompany?: string | null
  mentorStatus: MentorStatus
  isVerifiedAlumni?: boolean
  canReceiveRequest: boolean
  availabilityReason?: string | null
  bio?: string | null
  biography?: string | null
  city?: string | null
  workingMode?: WorkingMode | null
  mentoringType?: MentoringType | null
  supportedFields: { id: number; name: string }[]
  topics: string[]
  skills: { id: number; skillName: string; groupName: string }[]
  experiences: { id: number; title: string; company: string; startDate?: string | null; endDate?: string | null; isCurrent?: boolean }[]
  reputationScore: number
  rating: number
  reviewCount: number
  completedTasks: number
}

export interface RankingItem {
  rank: number
  mentorId: number
  userId: number
  fullName: string
  avatarUrl: string | null
  headline: string | null
  currentCompany: string | null
  reputationScore: number
  completedTasks: number
  rating: number
  reviewCount: number
}

export interface MentorRegistration {
  hasExistingRegistration: boolean
  mentorStatus: MentorStatus
  isComplete: boolean
  personalInfo: { fullName?: string | null; email: string; phone?: string | null; campus?: string | null; graduationYear?: number | null }
  professionalInfo: { bio?: string | null }
  mentoringInfo: { workingMode?: WorkingMode | null; mentoringType?: MentoringType | null; supportedIndustries: { id: number; name: string }[]; mentoringTopics: string[] }
  cvInfo: { cvFileKey?: string | null; cvDownloadUrl?: string | null }
  payoutAccount: { bankName?: string | null; bankBin?: string | null; bankAccountNumber?: string | null; bankAccountHolder?: string | null }
  termsAccepted: boolean
  missingFields: string[]
}

export interface MentorRegistrationRequest {
  fullName?: string | null
  phone?: string | null
  campus?: string | null
  graduationYear?: number | null
  bio?: string | null
  workingMode?: WorkingMode | null
  mentoringType?: MentoringType | null
  supportedIndustryIds?: number[]
  mentoringTopics?: string[]
  cvFileKey?: string | null
  bankName?: string | null
  bankBin?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
}

export interface MentorPackage { id: number; code: string; name: string; description?: string; durationMonths: number; price: number; status: string }
export interface MentorSubscription { id: number; packageName: string; durationMonths: number; priceAtPurchase: number; status: string; startDate?: string; endDate?: string }

export interface CheckoutResponse {
  transactionId: number
  orderCode: number
  amount: number
  description: string
  qrCodeUrl: string
  checkoutUrl: string
  paymentStatus: PaymentStatus
  paymentExpiresAt: string
  accountNumber?: string
  accountName?: string
}
export interface PaymentStatusResponse {
  orderCode: number
  amount: number
  paymentStatus: PaymentStatus
  isTerminal: boolean
  mentorStatus?: MentorStatus
}

/** UC88: danh mục bộ lọc động từ GET /mentors/filter-options. */
export interface MentorFilterOptions {
  industries: { id: number; name: string }[]
  specializations: { id: number; code: string; name: string }[]
  workingModes: { value: string; label: string }[]
  mentoringTypes: { value: string; label: string }[]
  popularSkills: string[]
}

const d = <T>(p: Promise<ApiResponse<T>>) => p.then((r) => r.data)

export const mentoringApi = {
  termsStatus: () => d(http.get<unknown, ApiResponse<TermsStatus>>('/mentoring/terms/status')),
  acceptTerms: () => d(http.post<unknown, ApiResponse<{ accepted: boolean }>>('/mentoring/terms/accept', {})),
  status: () => d(http.get<unknown, ApiResponse<MentorStatusResponse>>('/mentoring/status')),
  registration: () => d(http.get<unknown, ApiResponse<MentorRegistration>>('/mentoring/registration')),
  saveRegistration: (p: MentorRegistrationRequest) =>
    d(http.put<unknown, ApiResponse<{ mentorStatus: MentorStatus; isComplete: boolean; nextStep: string; missingFields: string[] }>>('/mentoring/registration', p)),
  packages: () => d(http.get<unknown, ApiResponse<MentorPackage[]>>('/mentoring/subscriptions/packages')),
  selectPackage: (packageId: number) =>
    d(http.post<unknown, ApiResponse<MentorSubscription>>('/mentoring/subscriptions/select-package', { packageId })),
  mySubscription: () => d(http.get<unknown, ApiResponse<MentorSubscription>>('/mentoring/subscriptions/my-subscription')),
  checkout: (packageId?: number) =>
    d(http.post<unknown, ApiResponse<CheckoutResponse>>('/mentoring/subscriptions/payment/checkout', packageId ? { packageId } : {})),
  paymentStatus: (orderCode: number) =>
    d(http.get<unknown, ApiResponse<PaymentStatusResponse>>(`/mentoring/subscriptions/payment/status/${orderCode}`)),
  cancelPayment: (orderCode: number) => d(http.post<unknown, ApiResponse<PaymentStatusResponse>>(`/mentoring/subscriptions/payment/cancel/${orderCode}`)),
  industries: () => http.get<unknown, ApiResponse<{ id: number; name: string }[]>>('/industries').then((r) => r.data ?? []),

  filterOptions: () => d(http.get<unknown, ApiResponse<MentorFilterOptions>>('/mentors/filter-options')),

  search: (p: { keyword?: string; fieldId?: number; majorId?: number; skill?: string; workingMode?: WorkingMode; mentoringType?: MentoringType; page?: number; sortBy?: string; sortDir?: string }) => {
    const params: Record<string, unknown> = { page: p.page ?? 0, size: 9 }
    if (p.keyword?.trim()) params.keyword = p.keyword.trim()
    if (p.fieldId != null) params.fieldId = p.fieldId
    if (p.majorId != null) params.majorId = p.majorId
    if (p.skill) params.skill = p.skill
    if (p.workingMode) params.workingMode = p.workingMode
    if (p.mentoringType) params.mentoringType = p.mentoringType
    if (p.sortBy) params.sortBy = p.sortBy
    if (p.sortDir) params.sortDirection = p.sortDir
    return d(http.get<unknown, ApiResponse<PageResponse<MentorCard>>>('/mentors', { params }))
  },
  mentor: (id: number | string) => d(http.get<unknown, ApiResponse<MentorDetail>>(`/mentors/${id}`)),
  ranking: (fieldId: number, page = 0) =>
    d(http.get<unknown, ApiResponse<PageResponse<RankingItem>>>('/mentoring/ranking', { params: { fieldId, page, size: 10 } })),
}

/** Lấy URL ảnh QR hiển thị được từ trường qrCodeUrl (có thể là chuỗi EMV thô). */
export function qrImageUrl(c: { qrCodeUrl?: string | null; checkoutUrl?: string }): string {
  const q = c.qrCodeUrl
  if (q && (q.startsWith('data:') || q.startsWith('http'))) return q
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(q || c.checkoutUrl || '')}`
}
