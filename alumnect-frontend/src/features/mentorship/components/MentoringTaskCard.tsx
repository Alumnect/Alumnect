import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarClock, MessageSquare, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { MentoringTaskBadge } from './MentoringTaskBadge'
import { MENTORING_TASK_TYPE_LABELS, MENTORING_WORKING_MODE_LABELS, formatVnd } from '../model/mentoringFlowLabels'
import type { MentoringTask } from '../model/mentoringTaskTypes'

interface MentoringTaskCardProps {
  task: MentoringTask
  onSelect?: (taskId: number) => void
}

const DAY_MS = 86_400_000

/** Thẻ Task trong "Công việc của tôi": trạng thái, người cùng làm, tiến độ, giá và hạn chót. */
export function MentoringTaskCard({ task, onSelect }: MentoringTaskCardProps) {
  const { t, i18n } = useTranslation()
  const currentUserId = Number(useAuthStore((s) => s.user?.id)) || 0
  // Mốc thời gian tại lần hiển thị đầu (không gọi Date.now() trong lúc render)
  const [now] = useState(() => Date.now())

  const formatDate = (value: string) => {
    const d = new Date(value)
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
  }

  const iAmMentor = currentUserId === task.mentorId
  const counterpart = iAmMentor
    ? { role: t('mentoring.studentCounterpart'), name: task.studentName || t('mentoring.studentCounterpart'), avatar: task.studentAvatar }
    : { role: 'Mentor', name: task.mentorName || 'Mentor', avatar: task.mentorAvatar }

  const deadlineMs = new Date(task.deadline).getTime()
  const isActive = task.status === 'PREPARATION' || task.status === 'IN_PROGRESS'
  // Cùng quy tắc với backend: chỉ Task đang chuẩn bị / thực hiện mới tính quá hạn
  const isOverdue = isActive && deadlineMs < now
  const daysLeft = Math.ceil((deadlineMs - now) / DAY_MS)
  const progress = Math.min(100, Math.max(0, task.progressPercentage ?? 0))
  const detailPath = `/app/mentoring/tasks/${task.id}`

  const handleOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onSelect) {
      e.preventDefault()
      onSelect(task.id)
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-brand-500/40 dark:hover:border-brand-500/40">
      <div className="flex items-center justify-between gap-2">
        <MentoringTaskBadge status={task.status} />
        <span className="text-xs font-medium text-text-subtle">Task #{task.id}</span>
      </div>

      <Link
        to={detailPath}
        onClick={handleOpen}
        className="mt-3 line-clamp-2 break-words font-display text-base font-bold text-text transition-colors hover:text-primary-solid"
      >
        {task.taskTitle}
      </Link>
      <p className="mt-1 text-xs text-text-subtle">
        {MENTORING_TASK_TYPE_LABELS[task.taskType] || task.taskType}
        {' · '}
        {MENTORING_WORKING_MODE_LABELS[task.workingMode] || task.workingMode}
      </p>

      <div className="mt-4 flex items-center gap-2.5">
        <Avatar src={counterpart.avatar || undefined} name={counterpart.name} size={32} />
        <div className="min-w-0">
          <p className="text-xs text-text-subtle">{counterpart.role}</p>
          <p className="truncate text-sm font-semibold text-text">{counterpart.name}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-subtle">
            {t('mentoring.progressLabel')}
            {task.pendingWorkLogs ? ` · ${t('mentoring.pendingWorkLogsCount', { count: task.pendingWorkLogs })}` : ''}
          </span>
          <span className="font-semibold text-text">{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-primary-solid transition duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl className="my-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-surface-2 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="flex items-center gap-1 text-text-subtle">
            <Wallet className="h-3.5 w-3.5" />
            {t('mentoring.agreedPrice')}
          </dt>
          <dd className="mt-0.5 font-semibold text-text">{formatVnd(task.agreedPrice)}</dd>
        </div>
        <div className={cn('rounded-xl px-3 py-2', isOverdue ? 'bg-danger-soft' : 'bg-surface-2 dark:bg-white/[0.04]')}>
          <dt
            className={cn(
              'flex items-center gap-1',
              isOverdue ? 'font-semibold text-danger' : 'text-text-subtle',
            )}
          >
            {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
            {isOverdue ? t('mentoring.overdue') : t('mentoring.deadlineLabel')}
          </dt>
          <dd className={cn('mt-0.5 font-semibold', isOverdue ? 'text-danger' : 'text-text')}>
            {formatDate(task.deadline)}
            {isActive && !isOverdue && daysLeft >= 0 && (
              <span className="font-normal text-text-subtle"> · {t('mentoring.daysRemaining', { count: daysLeft })}</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-border pt-4">
        {task.conversationId && (
          <ButtonLink
            to={`/app/mentoring/chats/${task.conversationId}`}
            variant="outline"
            size="sm"
            leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
            className="h-8 rounded-lg px-3 text-xs"
          >
            {t('mentoring.discuss')}
          </ButtonLink>
        )}
        <ButtonLink
          to={detailPath}
          onClick={handleOpen}
          size="sm"
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          className="h-8 rounded-lg px-3 text-xs"
        >
          {t('mentoring.openTask')}
        </ButtonLink>
      </div>
    </article>
  )
}

