import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from 'lucide-react'
import type { MentoringRequestStatus, MentoringRequestType, MentoringResponseStatus } from '../model/mentoringRequestTypes'
import { MentoringBadge, type MentoringTone } from './MentoringUi'

interface RequestTypeBadgeProps {
  type?: MentoringRequestType
  className?: string
}

/** Loại yêu cầu: gửi trực tiếp một Mentor (UC101) hoặc yêu cầu chung (UC100). */
export function RequestTypeBadge({ type = 'GENERAL', className }: RequestTypeBadgeProps) {
  if (type === 'DIRECT') {
    return <MentoringBadge tone="navy" icon={<Send />} className={className}>Gửi trực tiếp</MentoringBadge>
  }
  return <MentoringBadge tone="neutral" className={className}>Yêu cầu chung</MentoringBadge>
}

interface RequestStatusBadgeProps {
  status?: MentoringRequestStatus
  className?: string
}

const REQUEST_STATUS: Record<MentoringRequestStatus, { label: string; tone: MentoringTone }> = {
  OPEN: { label: 'Đang mở', tone: 'brand' },
  MATCHED: { label: 'Đã chốt Mentor · chờ thanh toán', tone: 'mint' },
  CLOSED: { label: 'Đã chuyển thành Task', tone: 'neutral' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'neutral' },
  CANCELLED: { label: 'Đã hủy', tone: 'coral' },
}

/** Trạng thái tổng thể của yêu cầu: OPEN, MATCHED, CLOSED, EXPIRED, CANCELLED. */
export function RequestStatusBadge({ status = 'OPEN', className }: RequestStatusBadgeProps) {
  const config = REQUEST_STATUS[status] ?? REQUEST_STATUS.OPEN
  return (
    <MentoringBadge tone={config.tone} className={className}>
      {config.label}
    </MentoringBadge>
  )
}

interface MentorResponseStatusBadgeProps {
  status?: MentoringResponseStatus | string
  className?: string
  showIcon?: boolean
}

/** Phản hồi của từng Mentor với một yêu cầu: chờ, đồng ý trao đổi, từ chối, quá hạn (UC102 & UC103). */
export function MentorResponseStatusBadge({ status = 'WAITING', className, showIcon = true }: MentorResponseStatusBadgeProps) {
  if (status === 'ACCEPTED') {
    return <MentoringBadge tone="mint" icon={showIcon && <CheckCircle2 />} className={className}>Đã đồng ý trao đổi</MentoringBadge>
  }
  if (status === 'DECLINED' || status === 'REJECTED') {
    return <MentoringBadge tone="coral" icon={showIcon && <XCircle />} className={className}>Đã từ chối</MentoringBadge>
  }
  if (status === 'EXPIRED') {
    return <MentoringBadge tone="neutral" icon={showIcon && <AlertCircle />} className={className}>Đã quá hạn</MentoringBadge>
  }
  return <MentoringBadge tone="gold" icon={showIcon && <Clock />} className={className}>Chờ phản hồi</MentoringBadge>
}
