import { ArrowRight, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'
import { MentorPageHeader } from './MentorPageHeader'

interface MentorStatusHeroProps {
  status: MentorStatusResponse
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function MentorStatusHero({ status, onRefresh, isRefreshing }: MentorStatusHeroProps) {
  const { t, i18n } = useTranslation()
  const { statusMessage, nextAction, actionUrl } = status

  const getActionLabel = () => {
    switch (nextAction) {
      case 'ACTIVE_DASHBOARD': return t('mentoring.actionActiveDashboard')
      case 'RESUME_PAYMENT': return t('mentoring.actionResumePayment')
      case 'PAYMENT_CHECKOUT': return t('mentoring.actionPaymentCheckout')
      case 'SELECT_PACKAGE': return t('mentoring.actionSelectPackage')
      case 'RENEW_SUBSCRIPTION': return t('mentoring.actionRenewSubscription')
      case 'ACCEPT_TERMS': return t('mentoring.actionAcceptTerms')
      default: return t('mentoring.actionCompleteProfile')
    }
  }

  // Đang hoạt động: thẻ gói bên dưới đã nói rõ, không cần thêm câu mô tả
  const description = status.active
    ? undefined
    : i18n.language === 'en'
      ? t('mentoring.mentorStatusDefaultDesc')
      : (statusMessage || t('mentoring.mentorStatusDefaultDesc'))

  return (
    <MentorPageHeader
      scene="status"
      title={t('mentoring.mentorStatusTitle')}
      description={description}
      actions={
        <>
          {/* Đang hoạt động thì hành động là "Về tổng quan" — trùng sidebar, không hiện */}
          {!status.active && (
            <ButtonLink
              to={actionUrl}
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {getActionLabel()}
            </ButtonLink>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {t('mentoring.refreshBtn')}
            </Button>
          )}
        </>
      }
    />
  )
}

