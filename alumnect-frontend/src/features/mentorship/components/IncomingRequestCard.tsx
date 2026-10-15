import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, CalendarClock, Coins, Laptop, Paperclip, Users } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { ButtonLink } from '@/components/ui/Button'
import { RequestStatusBadge, RequestTypeBadge, MentorResponseStatusBadge } from './RequestStatusBadge'
import { MentoringBadge } from './MentoringUi'
import { TASK_TYPE_OPTIONS, WORKING_MODE_LABELS, PARTICIPATION_TYPE_LABELS } from '../model/mentoringRequestTypes'
import type { MentorIncomingRequestData } from '../model/mentoringRequestTypes'
import { formatVnd } from '../model/mentoringFlowLabels'

interface IncomingRequestCardProps {
  request: MentorIncomingRequestData
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBudget(min?: number | null, max?: number | null) {
  if (min == null && max == null) return null
  if (min != null && max != null && min !== max) return `${formatVnd(min)} – ${formatVnd(max)}`
  const value = max ?? min ?? 0
  return value === 0 ? 'Miễn phí' : formatVnd(value)
}

/**
 * Một yêu cầu gửi đến Mentor (UC103): người gửi, nội dung tóm tắt, thông số chính
 * và một nút thao tác — "Phản hồi" khi đang chờ, "Xem chi tiết" khi đã phản hồi.
 */
export function IncomingRequestCard({ request }: IncomingRequestCardProps) {
  const detailPath = `/app/mentoring/incoming-requests/${request.id}`
  const isWaiting = request.responseStatus === 'WAITING'
  const taskLabel = TASK_TYPE_OPTIONS.find((t) => t.value === request.taskType)?.label ?? request.taskType
  const budget = formatBudget(request.budgetMin, request.budgetMax)

  const facts = [
    { icon: <Briefcase />, text: taskLabel },
    budget && { icon: <Coins />, text: budget },
    request.workingMode && { icon: <Laptop />, text: WORKING_MODE_LABELS[request.workingMode] },
    request.participationType && { icon: <Users />, text: PARTICIPATION_TYPE_LABELS[request.participationType] },
    request.expectedDeadline && { icon: <CalendarClock />, text: `Hạn ${formatDate(request.expectedDeadline)}` },
    request.attachmentCount > 0 && { icon: <Paperclip />, text: `${request.attachmentCount} tệp` },
  ].filter(Boolean) as { icon: ReactNode; text: string }[]

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-brand-500/40 hover:shadow-sm dark:hover:border-brand-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={request.studentAvatar || undefined} name={request.studentName} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{request.studentName}</p>
            <p className="truncate text-xs text-text-subtle">
              {request.studentHeadline || request.industryName} · nhận {formatDate(request.distributedAt)}
            </p>
          </div>
        </div>
        <MentorResponseStatusBadge status={request.responseStatus} />
      </div>

      <Link
        to={detailPath}
        className="mt-3 block font-display text-base font-bold text-text transition-colors hover:text-primary-solid"
      >
        {request.title}
      </Link>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">{request.description}</p>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-subtle">
        {facts.map((f) => (
          <li key={f.text} className="inline-flex items-center gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-plum-400">
            {f.icon}
            {f.text}
          </li>
        ))}
      </ul>

      {request.responseNote && (
        <p className="mt-3 line-clamp-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-text-muted dark:bg-white/[0.04]">
          <span className="font-semibold">Lời nhắn của bạn: </span>
          {request.responseNote}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <RequestTypeBadge type={request.requestType} />
          {request.requestStatus !== 'OPEN' && <RequestStatusBadge status={request.requestStatus} />}
          {request.sameIndustry && <MentoringBadge tone="navy">Cùng ngành</MentoringBadge>}
          {request.sameFormat && <MentoringBadge tone="mint">Cùng hình thức</MentoringBadge>}
        </div>
        <ButtonLink
          to={detailPath}
          size="sm"
          variant={isWaiting ? 'primary' : 'outline'}
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          className="h-8 rounded-lg px-3 text-xs"
        >
          {isWaiting ? 'Xem & phản hồi' : 'Xem chi tiết'}
        </ButtonLink>
      </div>
    </article>
  )
}
