import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarClock, MessageSquare, Wallet } from 'lucide-react'
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

function formatDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Thẻ Task trong "Nhiệm vụ của tôi": trạng thái, người cùng làm, tiến độ, giá và hạn chót. */
export function MentoringTaskCard({ task, onSelect }: MentoringTaskCardProps) {
  const currentUserId = Number(useAuthStore((s) => s.user?.id)) || 0
  // Mốc thời gian tại lần hiển thị đầu (không gọi Date.now() trong lúc render)
  const [now] = useState(() => Date.now())

  const iAmMentor = currentUserId === task.mentorId
  const counterpart = iAmMentor
    ? { role: 'Học viên', name: task.studentName || 'Học viên', avatar: task.studentAvatar }
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
    <article className="flex flex-col rounded-2xl border border-plum-900/[0.08] bg-white p-5 shadow-xs transition hover:border-brand-500/40 hover:shadow-sm dark:border-white/10 dark:bg-[#242526] dark:hover:border-brand-500/40">
      <div className="flex items-center justify-between gap-2">
        <MentoringTaskBadge status={task.status} />
        <span className="text-xs font-medium text-plum-400 dark:text-[#8f9399]">Task #{task.id}</span>
      </div>

      <Link
        to={detailPath}
        onClick={handleOpen}
        className="mt-3 line-clamp-2 break-words font-display text-base font-bold text-plum-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
      >
        {task.taskTitle}
      </Link>
      <p className="mt-1 text-xs text-plum-500 dark:text-[#b0b3b8]">
        {MENTORING_TASK_TYPE_LABELS[task.taskType] || task.taskType}
        {' · '}
        {MENTORING_WORKING_MODE_LABELS[task.workingMode] || task.workingMode}
      </p>

      <div className="mt-4 flex items-center gap-2.5">
        <Avatar src={counterpart.avatar || undefined} name={counterpart.name} size={32} />
        <div className="min-w-0">
          <p className="text-[11px] text-plum-400 dark:text-[#8f9399]">{counterpart.role}</p>
          <p className="truncate text-sm font-semibold text-plum-800 dark:text-[#e4e6eb]">{counterpart.name}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-plum-500 dark:text-[#b0b3b8]">
            Tiến độ
            {task.pendingWorkLogs ? ` · ${task.pendingWorkLogs} nhật ký chờ duyệt` : ''}
          </span>
          <span className="font-semibold text-plum-800 dark:text-[#e4e6eb]">{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl className="my-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-cream-100 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="flex items-center gap-1 text-plum-500 dark:text-[#b0b3b8]">
            <Wallet className="h-3.5 w-3.5" />
            Giá thỏa thuận
          </dt>
          <dd className="mt-0.5 font-semibold text-plum-900 dark:text-white">{formatVnd(task.agreedPrice)}</dd>
        </div>
        <div className={cn('rounded-xl px-3 py-2', isOverdue ? 'bg-coral-50 dark:bg-coral-900/20' : 'bg-cream-100 dark:bg-white/[0.04]')}>
          <dt
            className={cn(
              'flex items-center gap-1',
              isOverdue ? 'font-semibold text-coral-600 dark:text-coral-300' : 'text-plum-500 dark:text-[#b0b3b8]',
            )}
          >
            {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
            {isOverdue ? 'Quá hạn' : 'Hạn chót'}
          </dt>
          <dd className={cn('mt-0.5 font-semibold', isOverdue ? 'text-coral-700 dark:text-coral-300' : 'text-plum-900 dark:text-white')}>
            {formatDate(task.deadline)}
            {isActive && !isOverdue && daysLeft >= 0 && (
              <span className="font-normal text-plum-500 dark:text-[#b0b3b8]"> · còn {daysLeft} ngày</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-plum-900/[0.06] pt-4 dark:border-white/10">
        {task.conversationId && (
          <ButtonLink
            to={`/app/mentoring/chats/${task.conversationId}`}
            variant="outline"
            size="sm"
            leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
            className="h-8 rounded-lg px-3 text-xs"
          >
            Trao đổi
          </ButtonLink>
        )}
        <ButtonLink
          to={detailPath}
          onClick={handleOpen}
          size="sm"
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          className="h-8 rounded-lg px-3 text-xs"
        >
          Mở Task
        </ButtonLink>
      </div>
    </article>
  )
}
