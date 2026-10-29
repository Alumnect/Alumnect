import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MentoringRequestStatus, MentoringRequestType, MentoringResponseStatus } from '../model/mentoringRequestTypes'
import { MentoringBadge, type MentoringTone } from './MentoringUi'

interface RequestTypeBadgeProps {
  type?: MentoringRequestType
  className?: string
}

/** Loại yêu cầu: gửi trực tiếp một Mentor (UC101) hoặc yêu cầu chung (UC100). */
export function RequestTypeBadge({ type = 'GENERAL', className }: RequestTypeBadgeProps) {
  const { t } = useTranslation()
  if (type === 'DIRECT') {
    return <MentoringBadge tone="navy" icon={<Send />} className={className}>{t('mentoring.reqTypeDirect')}</MentoringBadge>
  }
  return <MentoringBadge tone="neutral" className={className}>{t('mentoring.reqTypeGeneral')}</MentoringBadge>
}

interface RequestStatusBadgeProps {
  status?: MentoringRequestStatus
  className?: string
}

const REQUEST_STATUS_CONFIG: Record<MentoringRequestStatus, { labelKey: string; tone: MentoringTone }> = {
  OPEN: { labelKey: 'mentoring.reqStatusOpen', tone: 'brand' },
  MATCHED: { labelKey: 'mentoring.reqStatusMatched', tone: 'mint' },
  CLOSED: { labelKey: 'mentoring.reqStatusClosed', tone: 'neutral' },
  EXPIRED: { labelKey: 'mentoring.reqStatusExpired', tone: 'neutral' },
  CANCELLED: { labelKey: 'mentoring.reqStatusCancelled', tone: 'coral' },
}

/** Trạng thái tổng thể của yêu cầu: OPEN, MATCHED, CLOSED, EXPIRED, CANCELLED. */
export function RequestStatusBadge({ status = 'OPEN', className }: RequestStatusBadgeProps) {
  const { t } = useTranslation()
  const config = REQUEST_STATUS_CONFIG[status] ?? REQUEST_STATUS_CONFIG.OPEN
  return (
    <MentoringBadge tone={config.tone} className={className}>
      {t(config.labelKey)}
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
  const { t } = useTranslation()
  if (status === 'ACCEPTED') {
    return <MentoringBadge tone="mint" icon={showIcon && <CheckCircle2 />} className={className}>{t('mentoring.mentorRespAccepted')}</MentoringBadge>
  }
  if (status === 'DECLINED' || status === 'REJECTED') {
    return <MentoringBadge tone="coral" icon={showIcon && <XCircle />} className={className}>{t('mentoring.mentorRespDeclined')}</MentoringBadge>
  }
  if (status === 'EXPIRED') {
    return <MentoringBadge tone="neutral" icon={showIcon && <AlertCircle />} className={className}>{t('mentoring.mentorRespExpired')}</MentoringBadge>
  }
  return <MentoringBadge tone="gold" icon={showIcon && <Clock />} className={className}>{t('mentoring.mentorRespWaiting')}</MentoringBadge>
}

