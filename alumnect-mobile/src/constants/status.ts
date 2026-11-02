/** Màu nhãn trạng thái dùng chung cho yêu cầu, deal, task, thanh toán... */
export type StatusTone = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'neutral'

const SUCCESS = ['ACCEPTED', 'MATCHED', 'DEAL_CONFIRMED', 'COMPLETED', 'PAID', 'APPROVED', 'ACTIVE', 'RESOLVED', 'SUCCESS', 'CONFIRMED', 'DONE', 'RELEASED']
const DANGER = ['DECLINED', 'REJECTED', 'CANCELLED', 'FAILED', 'DISPUTED', 'DISPUTE', 'TERMINATED', 'REFUNDED', 'OVERDUE']
const WARNING = ['WAITING', 'PENDING', 'PROPOSED', 'STUDENT_CONFIRMED', 'MENTOR_CONFIRMED', 'AWAITING_PAYMENT', 'PENDING_PAYMENT', 'REVIEW', 'SUBMITTED', 'PROCESSING', 'HOLD']
const NEUTRAL = ['CLOSED', 'EXPIRED', 'SUPERSEDED', 'INACTIVE', 'ARCHIVED']

export function statusTone(status?: string | null): StatusTone {
  const s = (status ?? '').toUpperCase()
  if (SUCCESS.includes(s)) return 'success'
  if (DANGER.includes(s)) return 'danger'
  if (WARNING.includes(s)) return 'warning'
  if (NEUTRAL.includes(s)) return 'neutral'
  return 'info'
}
