import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Badge, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import type { PaymentTransactionStatusResponse } from '../model/mentorPaymentTypes'

interface MentorPaymentSuccessCardProps {
  status: PaymentTransactionStatusResponse
  packageName?: string
  durationMonths?: number
}

/**
 * Component hiển thị thông báo thanh toán thành công và kích hoạt gói Cố vấn (UC93).
 */
export function MentorPaymentSuccessCard({
  status,
  packageName = 'Gói dịch vụ Mentor',
  durationMonths = 1,
}: MentorPaymentSuccessCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusText = (mentorStatus?: string) => {
    if (!mentorStatus || mentorStatus === 'ACTIVE') return t('mentoring.statusActive')
    if (mentorStatus === 'PAYMENT_PENDING' || mentorStatus === 'PENDING_PAYMENT') return t('mentoring.statusPaymentPending')
    if (mentorStatus === 'PENDING') return t('mentoring.statusPendingApproval')
    if (mentorStatus === 'INACTIVE') return t('mentoring.statusInactive')
    return mentorStatus
  }

  return (
    <Card
      hover={false}
      className="mx-auto max-w-xl p-8 rounded-3xl border border-success-border bg-surface text-center shadow-glow space-y-6"
    >
      {/* Icon chúc mừng tinh gọn */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex">
          <Badge tone="success" className="px-3 py-1 font-bold text-xs">
            {t('mentoring.paymentSuccessBadge')}
          </Badge>
        </div>
        <h2 className="font-display text-2xl font-bold text-text">
          {t('mentoring.congratsBecomeMentor')}
        </h2>
      </div>

      {/* Thông tin gói và hiệu lực mới */}
      <div className="rounded-2xl bg-bg p-5 text-left border border-border space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
          <span className="text-text-subtle">{t('mentoring.activatedPackage')}</span>
          <span className="font-bold text-text">{packageName}</span>
        </div>

        <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
          <span className="text-text-subtle">{t('mentoring.duration')}</span>
          <span className="font-semibold text-text">{t('mentoring.monthsUnit', { months: durationMonths })}</span>
        </div>

        <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
          <span className="text-text-subtle">{t('mentoring.expiryDate')}</span>
          <span className="font-bold text-primary-solid">
            {formatDate(status.subscriptionEndDate)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-text-subtle">{t('mentoring.mentorStatusLabel')}</span>
          <Badge tone={status.mentorStatus === 'ACTIVE' || !status.mentorStatus ? 'success' : 'gold'}>
            {getStatusText(status.mentorStatus)}
          </Badge>
        </div>
      </div>

      {/* Nút điều hướng */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          className="flex-1 cursor-pointer"
          onClick={() => navigate('/app/mentoring/subscription')}
        >
          {t('mentoring.viewServicePackages')}
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => navigate('/app/mentoring')}
        >
          <span>{t('mentoring.goToMentorFeed')}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
