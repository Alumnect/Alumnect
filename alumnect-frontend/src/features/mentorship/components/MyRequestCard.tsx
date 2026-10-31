import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Briefcase, CheckCircle2, Clock, Coins, Laptop, XCircle } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { ButtonLink } from '@/components/ui/Button'
import { RequestStatusBadge, RequestTypeBadge, MentorResponseStatusBadge } from './RequestStatusBadge'
import { MentoringBadge } from './MentoringUi'
import { TASK_TYPE_OPTIONS, WORKING_MODE_LABELS } from '../model/mentoringRequestTypes'
import type { CreateMentoringRequestData } from '../model/mentoringRequestTypes'
import { formatVnd } from '../model/mentoringFlowLabels'

interface MyRequestCardProps {
  request: CreateMentoringRequestData
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBudget(min?: number | null, max?: number | null, freeLabel = 'Miễn phí') {
  if (min == null && max == null) return null
  if (min != null && max != null && min !== max) return `${formatVnd(min)} – ${formatVnd(max)}`
  const value = max ?? min ?? 0
  return value === 0 ? freeLabel : formatVnd(value)
}

/**
 * Một yêu cầu trong "Yêu cầu của tôi" (UC102): trạng thái, nội dung tóm tắt
 * và phản hồi của Mentor (Mentor được gửi trực tiếp, hoặc số Mentor đồng ý / đang chờ / từ chối).
 */
export function MyRequestCard({ request }: MyRequestCardProps) {
  const { t } = useTranslation()
  const detailPath = `/app/mentoring/requests/${request.id}`
  const isDirect = request.requestType === 'DIRECT'
  const summary = request.responseSummary
  const accepted = summary?.acceptedCount ?? 0
  const waiting = summary?.waitingCount ?? request.matchedCount ?? 0
  const declined = summary?.declinedCount ?? 0
  const hasNews = isDirect ? request.directMentorResponseStatus === 'ACCEPTED' : accepted > 0
  const budget = formatBudget(request.budgetMin, request.budgetMax, t('common.free', 'Miễn phí'))

  const facts = [
    { icon: <Briefcase />, text: TASK_TYPE_OPTIONS.find((t) => t.value === request.taskType)?.label ?? request.taskType },
    budget && { icon: <Coins />, text: budget },
    request.workingMode && { icon: <Laptop />, text: WORKING_MODE_LABELS[request.workingMode] },
  ].filter(Boolean) as { icon: ReactNode; text: string }[]

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-brand-500/40 dark:hover:border-brand-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <RequestStatusBadge status={request.status} />
          <RequestTypeBadge type={request.requestType} />
        </div>
        <span className="shrink-0 text-xs text-text-subtle">{formatDate(request.createdAt)}</span>
      </div>

      <Link
        to={detailPath}
        className="mt-3 block font-display text-base font-bold text-text transition-colors hover:text-primary-solid"
      >
        {request.title}
      </Link>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">{request.description}</p>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-subtle">
        {request.industryName && <li>{request.industryName}</li>}
        {facts.map((f) => (
          <li key={f.text} className="inline-flex items-center gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-plum-400">
            {f.icon}
            {f.text}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {isDirect ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar src={request.targetMentorAvatar || undefined} name={request.targetMentorName || 'Mentor'} size={28} />
            <span className="truncate text-sm font-medium text-text">{request.targetMentorName || 'Mentor'}</span>
            <MentorResponseStatusBadge status={request.directMentorResponseStatus || 'WAITING'} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <MentoringBadge tone={accepted > 0 ? 'mint' : 'neutral'} icon={<CheckCircle2 />}>
              {t('mentoring.acceptedCountText', { count: accepted, defaultValue: `${accepted} đồng ý` })}
            </MentoringBadge>
            <MentoringBadge tone="gold" icon={<Clock />}>
              {t('mentoring.waitingCountText', { count: waiting, defaultValue: `${waiting} đang chờ` })}
            </MentoringBadge>
            {declined > 0 && (
              <MentoringBadge tone="coral" icon={<XCircle />}>
                {t('mentoring.declinedCountText', { count: declined, defaultValue: `${declined} từ chối` })}
              </MentoringBadge>
            )}
          </div>
        )}
        <ButtonLink
          to={detailPath}
          size="sm"
          variant={hasNews ? 'primary' : 'outline'}
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          className="h-8 rounded-lg px-3 text-xs"
        >
          {hasNews ? t('mentoring.viewFeedback', 'Xem phản hồi') : t('common.viewDetails', 'Xem chi tiết')}
        </ButtonLink>
      </div>
    </article>
  )
}
