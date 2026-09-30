export type MentorPackageStatus = 'ACTIVE' | 'INACTIVE'
export type MentorSubscriptionStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED'

/**
 * Interface cho gói dịch vụ Mentor do Admin cấu hình.
 */
export interface MentorPackage {
  id: number
  code: string
  name: string
  description?: string
  durationMonths: number
  price: number
  status: MentorPackageStatus
  createdAt: string
}

/**
 * Interface payload yêu cầu lựa chọn gói Mentor.
 */
export interface SelectMentorPackageRequest {
  packageId: number
}

/**
 * Interface phản hồi thông tin đăng ký / chọn gói Mentor.
 */
export interface MentorSubscription {
  id: number
  mentorProfileId: number
  packageId: number
  packageCode: string
  packageName: string
  durationMonths: number
  priceAtPurchase: number
  status: MentorSubscriptionStatus
  startDate?: string
  endDate?: string
  createdAt: string
  nextStep?: string
}
