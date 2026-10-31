import { useTranslation } from 'react-i18next'
import { Handshake, MessageSquare, Target, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MentoringDealSummary } from '../model/mentoringTaskTypes'

interface MentoringTaskDealSectionProps {
  deal?: MentoringDealSummary | null
  conversationId?: number | null
}

export function MentoringTaskDealSection({
  deal,
  conversationId,
}: MentoringTaskDealSectionProps) {
  const { t } = useTranslation()
  if (!deal) return null

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDeadline = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-solid">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-text">
              {t('mentoring.originalDealTitle')}
            </h4>
            <span className="text-xs font-mono font-bold text-text-subtle">
              #DEAL-{deal.id} ({t('mentoring.version')} v{deal.version})
            </span>
          </div>
        </div>

        {conversationId && (
          <Link
            to={`/app/mentoring/chats/${conversationId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-soft px-3.5 py-2 text-xs font-bold text-primary-solid transition-colors hover:bg-primary-soft"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{t('mentoring.openMessage')}</span>
          </Link>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            {t('mentoring.finalizedTaskScope')}
          </span>
          <p className="mt-1 text-sm leading-relaxed text-text">
            {deal.taskScope}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            {t('mentoring.expectedOutputResult')}
          </span>
          <div className="mt-1 flex items-start gap-2 rounded-2xl border border-border bg-cream-100/70 p-3.5 text-sm text-text-muted dark:bg-bg">
            <Target className="h-4 w-4 shrink-0 text-primary-solid mt-0.5" />
            <p className="leading-relaxed">{deal.expectedResult}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl border border-border bg-cream-100/70 p-3.5 dark:bg-bg">
            <span className="text-xs font-bold text-text-subtle">{t('mentoring.agreedDealPrice')}</span>
            <p className="mt-1 text-sm font-bold text-primary-solid">
              {formatPrice(deal.agreedPrice)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-cream-100/70 p-3.5 dark:bg-bg">
            <span className="text-xs font-bold text-text-subtle">{t('mentoring.dealDeadline')}</span>
            <p className="mt-1 text-sm font-bold text-text">
              {formatDeadline(deal.deadline)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-border bg-cream-100/70 p-3.5 dark:bg-bg">
            <span className="text-xs font-bold text-text-subtle">{t('mentoring.dealPaymentStatus')}</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span>{t('mentoring.paidStatusText')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
