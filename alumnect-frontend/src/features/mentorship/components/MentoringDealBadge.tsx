import { CheckCircle2, Clock, History, MessagesSquare, ShieldCheck, XCircle } from 'lucide-react'
import type { MentoringDealStatus } from '../model/mentoringDealTypes'
import { MentoringBadge } from './MentoringUi'

interface MentoringDealBadgeProps {
  status: MentoringDealStatus
  isLocked?: boolean
  isPaid?: boolean
  className?: string
}

/** Huy hiệu trạng thái Mentoring Deal (UC104 & UC105). */
export function MentoringDealBadge({ status, isLocked, isPaid, className }: MentoringDealBadgeProps) {
  if (isPaid) {
    return <MentoringBadge tone="mint" icon={<CheckCircle2 />} className={className}>Đã thanh toán</MentoringBadge>
  }
  if (status === 'DEAL_CONFIRMED' || isLocked) {
    return <MentoringBadge tone="mint" icon={<ShieldCheck />} className={className}>Đã chốt · chờ thanh toán</MentoringBadge>
  }
  if (status === 'STUDENT_CONFIRMED') {
    return <MentoringBadge tone="brand" icon={<Clock />} className={className}>Học viên đã xác nhận · chờ Mentor</MentoringBadge>
  }
  if (status === 'MENTOR_CONFIRMED') {
    return <MentoringBadge tone="navy" icon={<Clock />} className={className}>Mentor đã xác nhận · chờ Học viên</MentoringBadge>
  }
  if (status === 'REJECTED') {
    return <MentoringBadge tone="coral" icon={<XCircle />} className={className}>Đã từ chối</MentoringBadge>
  }
  if (status === 'SUPERSEDED') {
    return <MentoringBadge tone="neutral" icon={<History />} className={className}>Phiên bản cũ</MentoringBadge>
  }
  if (status === 'CANCELLED') {
    return <MentoringBadge tone="neutral" icon={<XCircle />} className={className}>Đã hủy</MentoringBadge>
  }
  return <MentoringBadge tone="gold" icon={<MessagesSquare />} className={className}>Đang thương lượng</MentoringBadge>
}
