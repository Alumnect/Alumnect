import i18n from '@/i18n'

function createLocalizedMap(vi: Record<string, string>, en: Record<string, string>): Record<string, string> {
  return new Proxy(vi, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return Reflect.get(target, prop)
      const isEn = i18n.language === 'en'
      if (isEn && en[prop]) {
        return en[prop]
      }
      return target[prop] || (isEn ? en[prop] : undefined)
    },
    ownKeys(target) {
      return Reflect.ownKeys(target)
    },
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })
}

const MENTORING_TASK_TYPE_VI: Record<string, string> = {
  CAREER_ORIENTATION: 'Định hướng nghề nghiệp',
  TECHNICAL_CONSULTING: 'Tư vấn kỹ thuật chuyên sâu',
  CAPSTONE_ADVICE: 'Cố vấn đồ án tốt nghiệp',
  CONSULTATION: 'Tư vấn định hướng học tập & nghề nghiệp',
  ASSIGNMENT_GUIDANCE: 'Hướng dẫn bài tập / Đồ án tốt nghiệp',
  PROJECT_MENTORING: 'Cố vấn thực chiến dự án phần mềm',
  RESUME_REVIEW: 'Đánh giá, chỉnh sửa CV',
  MOCK_INTERVIEW: 'Phỏng vấn thử (Mock Interview)',
  SKILL_TRAINING: 'Đào tạo kỹ năng chuyên sâu',
  OTHER: 'Khác',
}

const MENTORING_TASK_TYPE_EN: Record<string, string> = {
  CAREER_ORIENTATION: 'Career Orientation',
  TECHNICAL_CONSULTING: 'In-depth Technical Consulting',
  CAPSTONE_ADVICE: 'Capstone Project Mentoring',
  CONSULTATION: 'Academic & Career Consultation',
  ASSIGNMENT_GUIDANCE: 'Assignment & Capstone Guidance',
  PROJECT_MENTORING: 'Hands-on Software Project Mentoring',
  RESUME_REVIEW: 'Resume & CV Review',
  MOCK_INTERVIEW: 'Mock Interview',
  SKILL_TRAINING: 'Specialized Skill Training',
  OTHER: 'Other',
}

export const MENTORING_TASK_TYPE_LABELS = createLocalizedMap(MENTORING_TASK_TYPE_VI, MENTORING_TASK_TYPE_EN)

const MENTORING_WORKING_MODE_VI: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BOTH: 'Linh hoạt (Online & Offline)',
}

const MENTORING_WORKING_MODE_EN: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BOTH: 'Flexible (Online & Offline)',
}

export const MENTORING_WORKING_MODE_LABELS = createLocalizedMap(MENTORING_WORKING_MODE_VI, MENTORING_WORKING_MODE_EN)

const MENTORING_PARTICIPATION_VI: Record<string, string> = {
  INDIVIDUAL: 'Cá nhân (1-1)',
  GROUP: 'Nhóm',
  BOTH: 'Cá nhân hoặc nhóm',
}

const MENTORING_PARTICIPATION_EN: Record<string, string> = {
  INDIVIDUAL: 'Individual (1-on-1)',
  GROUP: 'Group',
  BOTH: 'Individual or Group',
}

export const MENTORING_PARTICIPATION_LABELS = createLocalizedMap(MENTORING_PARTICIPATION_VI, MENTORING_PARTICIPATION_EN)

const PROPOSAL_SOURCE_VI: Record<string, string> = {
  REQUEST_ACCEPTANCE: 'Chấp nhận theo Request',
  RENEGOTIATION: 'Deal lại',
}

const PROPOSAL_SOURCE_EN: Record<string, string> = {
  REQUEST_ACCEPTANCE: 'Accept from Request',
  RENEGOTIATION: 'Renegotiate',
}

export const PROPOSAL_SOURCE_LABELS = createLocalizedMap(PROPOSAL_SOURCE_VI, PROPOSAL_SOURCE_EN)

const MENTORING_REQUEST_FLOW_STATUS_VI: Record<string, string> = {
  OPEN: 'Đang mở · thương lượng',
  MATCHED: 'Đã chốt Mentor · chờ thanh toán',
  CLOSED: 'Đã chuyển thành Task',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

const MENTORING_REQUEST_FLOW_STATUS_EN: Record<string, string> = {
  OPEN: 'Open · Negotiating',
  MATCHED: 'Mentor Selected · Pending Payment',
  CLOSED: 'Converted to Task',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
}

export const MENTORING_REQUEST_FLOW_STATUS_LABELS = createLocalizedMap(MENTORING_REQUEST_FLOW_STATUS_VI, MENTORING_REQUEST_FLOW_STATUS_EN)

const MENTORING_TASK_STATUS_VI: Record<string, string> = {
  PREPARATION: 'Chuẩn bị',
  IN_PROGRESS: 'Đang thực hiện',
  SUBMITTED: 'Đã nộp kết quả',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Đang tranh chấp',
  RESOLVED: 'Đã phân xử',
}

const MENTORING_TASK_STATUS_EN: Record<string, string> = {
  PREPARATION: 'Preparation',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
  RESOLVED: 'Resolved',
}

export const MENTORING_TASK_STATUS_LABELS = createLocalizedMap(MENTORING_TASK_STATUS_VI, MENTORING_TASK_STATUS_EN)

const MENTORING_RESPONSE_STATUS_VI: Record<string, string> = {
  WAITING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  DECLINED: 'Đã từ chối',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

const MENTORING_RESPONSE_STATUS_EN: Record<string, string> = {
  WAITING: 'Awaiting Response',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  REJECTED: 'Declined',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
}

export const MENTORING_RESPONSE_STATUS_LABELS = createLocalizedMap(MENTORING_RESPONSE_STATUS_VI, MENTORING_RESPONSE_STATUS_EN)

const MENTORING_DISTRIBUTION_STATUS_VI: Record<string, string> = {
  PENDING: 'Đang chờ',
  WAITING: 'Đang chờ',
  ACCEPTED: 'Đã chấp nhận',
  DECLINED: 'Đã từ chối',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

const MENTORING_DISTRIBUTION_STATUS_EN: Record<string, string> = {
  PENDING: 'Pending',
  WAITING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  REJECTED: 'Declined',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
}

export const MENTORING_DISTRIBUTION_STATUS_LABELS = createLocalizedMap(MENTORING_DISTRIBUTION_STATUS_VI, MENTORING_DISTRIBUTION_STATUS_EN)

const MENTORING_DEAL_STATUS_VI: Record<string, string> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  DECLINED: 'Đã từ chối',
  DEAL_CONFIRMED: 'Đã chốt thỏa thuận',
  CONFIRMED: 'Đã chốt thỏa thuận',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Đã hết hạn',
  SUPERSEDED: 'Đã thay thế',
}

const MENTORING_DEAL_STATUS_EN: Record<string, string> = {
  PENDING: 'Awaiting Response',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  DECLINED: 'Declined',
  DEAL_CONFIRMED: 'Deal Confirmed',
  CONFIRMED: 'Deal Confirmed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  SUPERSEDED: 'Superseded',
}

export const MENTORING_DEAL_STATUS_LABELS = createLocalizedMap(MENTORING_DEAL_STATUS_VI, MENTORING_DEAL_STATUS_EN)

const MENTORING_TICKET_STATUS_VI: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã từ chối',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

const MENTORING_TICKET_STATUS_EN: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const MENTORING_TICKET_STATUS_LABELS = createLocalizedMap(MENTORING_TICKET_STATUS_VI, MENTORING_TICKET_STATUS_EN)

const MENTORING_FINANCE_STATUS_VI: Record<string, string> = {
  ESCROW_HELD: 'Đang giữ Escrow',
  DISBURSED: 'Đã giải ngân',
  REFUNDED: 'Đã hoàn tiền',
  COMPLETED: 'Hoàn tất',
  SETTLED: 'Đã quyết toán',
  PARTIALLY_SETTLED: 'Quyết toán một phần',
}

const MENTORING_FINANCE_STATUS_EN: Record<string, string> = {
  ESCROW_HELD: 'Escrow Held',
  DISBURSED: 'Disbursed',
  REFUNDED: 'Refunded',
  COMPLETED: 'Completed',
  SETTLED: 'Settled',
  PARTIALLY_SETTLED: 'Partially Settled',
}

export const MENTORING_FINANCE_STATUS_LABELS = createLocalizedMap(MENTORING_FINANCE_STATUS_VI, MENTORING_FINANCE_STATUS_EN)

/** Định dạng tiền VND */
export function formatVnd(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}
