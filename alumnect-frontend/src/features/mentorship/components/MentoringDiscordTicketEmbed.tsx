import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Clock, CreditCard, Loader2, RefreshCw, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { MentoringTicketData } from './MentoringTicketDetailModal'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
} from '../model/mentoringFlowLabels'

interface MentoringDiscordTicketEmbedProps {
  ticket: MentoringTicketData
  isMe?: boolean
  isRecipient?: boolean
  canAct?: boolean
  onConfirm?: () => Promise<void> | void
  onReject?: () => void
  onRevert?: () => void
  onPay?: () => void
  onViewDetail?: () => void
  isConfirming?: boolean
  isRejecting?: boolean
  accompanyingText?: string
}

const formatVND = (amount?: number) =>
  typeof amount === 'number' ? `${new Intl.NumberFormat('vi-VN').format(amount)}đ` : '—'

const safeFormat = (value: string | undefined, pattern: string) => {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : format(d, pattern)
}

/** Ô thông tin trong lưới điều khoản: nhãn xám nhỏ, giá trị đậm. */
function Fact({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="min-w-0 bg-surface px-3 py-2.5">
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-text', strong ? 'text-base font-semibold tabular-nums' : 'text-sm font-medium')}>
        {children}
      </dd>
    </div>
  )
}

/**
 * Thẻ đề xuất (thỏa thuận / gia hạn) hiển thị trong cuộc trò chuyện Mentor – học viên.
 * Bề mặt phẳng, điều khoản chính trong một lưới 4 ô, một nút chính duy nhất cho bên cần phản hồi.
 */
export function MentoringDiscordTicketEmbed({
  ticket,
  isMe = false,
  isRecipient = false,
  canAct = false,
  onConfirm,
  onReject,
  onRevert,
  onPay,
  onViewDetail,
  isConfirming = false,
  isRejecting = false,
  accompanyingText,
}: MentoringDiscordTicketEmbedProps) {
  const { t } = useTranslation()
  const isExtension = ticket.ticketType === 'EXTENSION'
  const timeString = safeFormat(ticket.createdAt, 'HH:mm')
  const needsMyAnswer = ticket.status === 'PENDING' && canAct && isRecipient
  const busy = isConfirming || isRejecting
  // Màn rộng đã có cột "Thỏa thuận" nên thẻ đề xuất thu gọn; thẻ gia hạn giữ đầy đủ vì cột không hiển thị nó
  const compact = isExtension ? '' : 'lg:hidden'

  const status = (() => {
    switch (ticket.status) {
      case 'CONFIRMED':
        return { label: ticket.isPaid ? t('mentoring.statusPaid', 'Đã thanh toán') : t('mentoring.statusConfirmed', 'Đã xác nhận'), tone: 'bg-success-soft text-success' }
      case 'REJECTED':
        return { label: t('mentoring.statusRejected', 'Đã từ chối'), tone: 'bg-danger-soft text-danger' }
      case 'ADJUSTMENT':
        return { label: t('mentoring.statusRequestedAdjustment', 'Đã yêu cầu điều chỉnh'), tone: 'bg-warning-soft text-warning' }
      case 'SUPERSEDED':
        return { label: t('mentoring.statusSuperseded', 'Đã thay thế'), tone: 'bg-surface-3 text-text-muted' }
      default:
        return { label: t('mentoring.statusPendingConfirmation', 'Chờ xác nhận'), tone: 'bg-warning-soft text-warning' }
    }
  })()

  const ghostBtn =
    'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-50'
  const primaryBtn =
    'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary-solid px-3.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50'

  const renderActions = () => {
    if (needsMyAnswer) {
      return (
        <>
          <button type="button" onClick={onReject} disabled={busy} title={t('mentoring.rejectDealTooltip')} className="h-8 px-2 text-xs font-semibold text-danger hover:underline disabled:opacity-50">
            {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('mentoring.rejectBtn')}
          </button>
          {onRevert && (
            <button type="button" onClick={onRevert} disabled={busy} title={t('mentoring.requestAdjustmentTooltip')} className={ghostBtn}>
              {t('mentoring.requestAdjustmentBtn')}
            </button>
          )}
          <button type="button" onClick={onConfirm} disabled={busy} className={primaryBtn}>
            {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {t('mentoring.confirmAndPayBtn')}
          </button>
        </>
      )
    }
    if (ticket.status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-text-subtle">
          <Clock className="h-3.5 w-3.5" />
          {t('mentoring.statusWaitingResponse', 'Chờ phản hồi')}
        </span>
      )
    }
    if (ticket.status === 'CONFIRMED') {
      if (ticket.isPaid) return null
      return !ticket.isMentor && onPay ? (
        <button type="button" onClick={onPay} className={primaryBtn}>
          <CreditCard className="h-3.5 w-3.5" />
          {t('mentoring.payTaskNowBtn')}
        </button>
      ) : (
        <span className="text-xs text-text-subtle">{t('mentoring.statusFinalizedAwaitingPayment', 'Đã chốt • Chờ thanh toán')}</span>
      )
    }
    if (ticket.status === 'REJECTED' || ticket.status === 'ADJUSTMENT') {
      return onRevert ? (
        <button type="button" onClick={onRevert} title={t('mentoring.redealTooltip')} className={ghostBtn}>
          <RefreshCw className="h-3.5 w-3.5" />
          {t('mentoring.redealBtn')}
        </button>
      ) : ticket.status === 'ADJUSTMENT' ? (
        <span className="text-xs text-text-subtle">{t('mentoring.statusWaitingMentorNewVersion', 'Chờ Mentor gửi phiên bản mới')}</span>
      ) : ticket.handlerName ? (
        <span className="inline-flex items-center gap-1 text-xs text-text-subtle">
          <X className="h-3.5 w-3.5" />
          {ticket.handlerName}
        </span>
      ) : null
    }
    return null
  }

  const actions = renderActions()

  return (
    <div className={cn('my-2 flex w-full flex-col gap-1.5', isMe ? 'items-end' : 'items-start')}>
      {accompanyingText && (
        <div className={cn('max-w-lg rounded-2xl px-4 py-2 text-sm', isMe ? 'bg-primary-solid text-on-primary' : 'bg-surface-3 text-text')}>
          {accompanyingText}
        </div>
      )}

      <article
        className={cn(
          'w-full max-w-lg overflow-hidden rounded-2xl border bg-surface',
          needsMyAnswer ? 'border-primary/50 ring-1 ring-primary/15' : 'border-border',
          ticket.status === 'SUPERSEDED' && 'opacity-70'
        )}
      >
        <header className="flex items-start justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <p className="truncate text-xs text-text-subtle">
              {ticket.senderName}
              {timeString ? ` · ${timeString}` : ''}
            </p>
            <h4 className="mt-0.5 text-sm font-semibold text-text">
              {isExtension ? t('mentoring.ticketExtension') : t('mentoring.dealTicketHeading')}
              {ticket.version ? (
                <span className="font-normal text-text-subtle">{t('mentoring.dealTicketVersionSuffix', { version: ticket.version })}</span>
              ) : null}
              {!isExtension ? (
                <span className="hidden font-semibold tabular-nums text-text lg:inline"> · {formatVND(ticket.agreedPrice)}</span>
              ) : null}
            </h4>
          </div>
          <span className={cn('shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', status.tone)}>
            {status.label}
          </span>
        </header>

        {isExtension ? (
          <>
            <dl className="mx-4 mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
              <Fact label={t('mentoring.currentDeadlineLabel').replace(':', '').trim()}>
                {safeFormat(ticket.currentDeadline, 'dd/MM/yyyy') || t('mentoring.undetermined')}
              </Fact>
              <Fact label={t('mentoring.proposedDeadline').replace(':', '').trim()} strong>
                {safeFormat(ticket.proposedDeadline, 'dd/MM/yyyy') || t('mentoring.undetermined')}
              </Fact>
            </dl>
            {ticket.extensionReason && (
              <p className="mx-4 mt-3 line-clamp-2 text-sm text-text-muted">{ticket.extensionReason}</p>
            )}
          </>
        ) : (
          <>
            {ticket.taskScope && <p className={cn('mx-4 mt-2 line-clamp-3 text-sm leading-6 text-text', compact)}>{ticket.taskScope}</p>}
            <dl className={cn('mx-4 mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border', compact)}>
              <Fact label={t('mentoring.agreedPriceShort').replace(':', '').trim()} strong>
                {formatVND(ticket.agreedPrice)}
              </Fact>
              <Fact label={t('mentoring.dealDeadline', 'Thời hạn thỏa thuận')}>
                {safeFormat(ticket.deadline, 'dd/MM/yyyy') || t('mentoring.undetermined')}
              </Fact>
              <Fact label={t('mentoring.modeLabel').replace(':', '').trim()}>
                {MENTORING_WORKING_MODE_LABELS[ticket.workingMode || ''] || t('mentoring.flexible')} ·{' '}
                {MENTORING_PARTICIPATION_LABELS[ticket.participationType || ''] || t('mentoring.individual1on1')}
              </Fact>
              <Fact label={t('mentoring.taskTypeShort', 'Loại hỗ trợ')}>
                {MENTORING_TASK_TYPE_LABELS[ticket.taskType || ''] || ticket.taskType || t('mentoring.defaultTaskLabel')}
              </Fact>
            </dl>
            {ticket.expectedResult && (
              <p className={cn('mx-4 mt-3 line-clamp-2 text-xs leading-5 text-text-subtle', compact)}>
                <span className="font-semibold text-text-muted">{t('mentoring.resultLabel')} </span>
                {ticket.expectedResult}
              </p>
            )}
          </>
        )}

        <footer className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={onViewDetail}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text"
          >
            {t('mentoring.viewDetailBtn')}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          {actions && <div className={cn('flex flex-wrap items-center justify-end gap-2', compact)}>{actions}</div>}
        </footer>
      </article>
    </div>
  )
}
