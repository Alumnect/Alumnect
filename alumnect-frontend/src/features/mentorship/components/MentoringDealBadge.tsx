import { CheckCircle2, Clock, History, MessagesSquare, ShieldCheck, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  if (isPaid) {
    return <MentoringBadge tone="mint" icon={<CheckCircle2 />} className={className}>{t('mentoring.dealStatusPaid')}</MentoringBadge>
  }
  if (status === 'DEAL_CONFIRMED' || isLocked) {
    return <MentoringBadge tone="mint" icon={<ShieldCheck />} className={className}>{t('mentoring.dealStatusConfirmed')}</MentoringBadge>
  }
  if (status === 'STUDENT_CONFIRMED') {
    return <MentoringBadge tone="brand" icon={<Clock />} className={className}>{t('mentoring.dealStatusStudentConfirmed')}</MentoringBadge>
  }
  if (status === 'MENTOR_CONFIRMED') {
    return <MentoringBadge tone="navy" icon={<Clock />} className={className}>{t('mentoring.dealStatusMentorConfirmed')}</MentoringBadge>
  }
  if (status === 'REJECTED') {
    return <MentoringBadge tone="coral" icon={<XCircle />} className={className}>{t('mentoring.dealStatusRejected')}</MentoringBadge>
  }
  if (status === 'SUPERSEDED') {
    return <MentoringBadge tone="neutral" icon={<History />} className={className}>{t('mentoring.dealStatusSuperseded')}</MentoringBadge>
  }
  if (status === 'CANCELLED') {
    return <MentoringBadge tone="neutral" icon={<XCircle />} className={className}>{t('mentoring.dealStatusCancelled')}</MentoringBadge>
  }
  return <MentoringBadge tone="gold" icon={<MessagesSquare />} className={className}>{t('mentoring.dealStatusNegotiating')}</MentoringBadge>
}

