import type { MentorStatus } from './mentorRegistrationTypes'
import type { MentorSubscriptionStatus } from './mentorSubscriptionTypes'

export type { MentorStatus }
export type { MentorSubscriptionStatus }

/**
 * Interface phản hồi tổng hợp trạng thái Mentor & Subscription (UC94).
 */
export interface MentorStatusResponse {
  /** Trạng thái Mentor: INCOMPLETE, PAYMENT_PENDING, ACTIVE, EXPIRED */
  mentorStatus: MentorStatus

  /** Cờ trạng thái hoạt động chính thức */
  active: boolean

  /** Thông điệp giải thích trạng thái bằng Tiếng Việt */
  statusMessage: string

  /** Đã có bản ghi hồ sơ Mentor chưa */
  hasMentorProfile: boolean

  /** Hồ sơ nghề nghiệp & cố vấn đã hoàn thiện 100% chưa */
  profileComplete: boolean

  /** Danh sách các trường hồ sơ còn thiếu nếu có */
  missingProfileFields: string[]

  /** Đã tải lên CV chưa */
  hasCv: boolean

  /** Trạng thái CV: UPLOADED hoặc MISSING */
  cvStatus: 'UPLOADED' | 'MISSING'

  /** Tên hiển thị tệp CV */
  cvFileName?: string | null

  /** Đã khai báo đầy đủ tài khoản ngân hàng chưa */
  bankInformationComplete: boolean

  /** Trạng thái tài khoản ngân hàng: CONFIGURED hoặc INCOMPLETE */
  bankInformationStatus: 'CONFIGURED' | 'INCOMPLETE'

  /** Tên ngân hàng */
  bankName?: string | null

  /** Số tài khoản làm mờ (Masked) */
  maskedAccountNumber?: string | null

  /** Tên chủ tài khoản thụ hưởng */
  bankAccountHolder?: string | null

  /** Đã chấp nhận điều khoản Mentoring chưa */
  termsAccepted: boolean

  /** Phiên bản điều khoản hiện hành */
  currentTermsVersion: string

  /** Thời điểm chấp nhận điều khoản */
  termsAcceptedAt?: string | null

  /** Đã từng chọn/mua subscription chưa */
  hasSubscription: boolean

  /** ID bản ghi subscription */
  subscriptionId?: number | null

  /** Trạng thái subscription: PENDING_PAYMENT, ACTIVE, PAID, CANCELLED, EXPIRED */
  subscriptionStatus?: MentorSubscriptionStatus | null

  /** ID gói dịch vụ */
  packageId?: number | null

  /** Mã gói dịch vụ */
  packageCode?: string | null

  /** Tên gói dịch vụ */
  packageName?: string | null

  /** Giá mua gói */
  priceAtPurchase?: number | null

  /** Thời hạn gói tính theo tháng */
  durationMonths?: number | null

  /** Thời điểm bắt đầu hiệu lực gói */
  startDate?: string | null

  /** Alias bắt đầu gói */
  startedAt?: string | null

  /** Thời điểm hết hạn gói */
  endDate?: string | null

  /** Alias hết hạn gói */
  expiredAt?: string | null

  /** Số ngày còn lại */
  remainingDays?: number | null

  /** Mã đơn hàng PayOS đang chờ thanh toán nếu có */
  pendingPaymentOrderCode?: number | null

  /** Danh sách các điều kiện còn thiếu để trở thành Mentor ACTIVE */
  missingRequirements: string[]

  /** Mã hành động tiếp theo khuyến nghị */
  nextAction: string

  /** Đường dẫn điều hướng cho hành động tiếp theo */
  actionUrl: string
}
