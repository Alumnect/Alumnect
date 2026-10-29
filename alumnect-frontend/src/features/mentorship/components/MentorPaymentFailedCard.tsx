import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Badge, Button } from '@/components/ui'
import type { PaymentStatus } from '../model/mentorPaymentTypes'

interface MentorPaymentFailedCardProps {
  status: PaymentStatus
  onRetry: () => void
  onBackToPackages: () => void
}

/**
 * Component hiển thị khi phiên thanh toán PayOS bị thất bại, hết hạn hoặc bị hủy (UC93).
 */
export function MentorPaymentFailedCard({
  status,
  onRetry,
  onBackToPackages,
}: MentorPaymentFailedCardProps) {
  const { t } = useTranslation()
  const getStatusText = () => {
    switch (status) {
      case 'EXPIRED':
        return t('mentoring.paymentExpired15m')
      case 'CANCELLED':
        return t('mentoring.paymentCancelledByUser')
      case 'FAILED':
      default:
        return t('mentoring.paymentFailedDefault')
    }
  }

  return (
    <Card
      hover={false}
      className="mx-auto max-w-xl p-8 rounded-3xl border border-danger-border bg-surface text-center shadow-card space-y-6"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex">
          <Badge tone="danger">
            {status === 'EXPIRED' ? t('mentoring.badgeExpired') : status === 'CANCELLED' ? t('mentoring.badgeCancelled') : t('mentoring.badgeFailed')}
          </Badge>
        </div>
        <h2 className="font-display text-xl font-bold text-text">
          {t('mentoring.cannotCompletePaymentTitle')}
        </h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          {t('mentoring.paymentFailedDesc', { status: getStatusText() })}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={onBackToPackages}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('mentoring.selectAnotherPackage')}</span>
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t('mentoring.retryPayment')}</span>
        </Button>
      </div>
    </Card>
  )
}
