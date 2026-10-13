import { DollarSign, ArrowRight, MessageSquare, BookOpen, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { MentoringTaskBadge, MentoringTaskStageBadge } from './MentoringTaskBadge'
import type { MentoringTask } from '../model/mentoringTaskTypes'

interface MentoringTaskCardProps {
  task: MentoringTask
  onSelect?: (taskId: number) => void
}

export function MentoringTaskCard({ task, onSelect }: MentoringTaskCardProps) {
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const calculateDaysRemaining = (dateStr: string) => {
    try {
      const now = new Date().getTime()
      const deadline = new Date(dateStr).getTime()
      const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return 0
    }
  }

  const daysRemaining = calculateDaysRemaining(task.deadline)
  const isOverdue = daysRemaining < 0 && task.status !== 'COMPLETED'
  const uiStage = task.uiStage || (task.status === 'PREPARATION' ? 'PREPARATION' : task.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'ENDING')
  const progress = task.progressPercentage ?? (task.status === 'COMPLETED' ? 100 : task.status === 'PREPARATION' ? 15 : 45)

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-[#393a3b] dark:bg-[#242526]">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-plum-900/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-plum-900/[0.05] px-2.5 py-1 text-xs font-mono font-bold text-plum-600 dark:bg-white/10 dark:text-[#b0b3b8]">
              #TASK-{task.id}
            </span>
            <MentoringTaskStageBadge stage={uiStage} />
          </div>
          <MentoringTaskBadge status={task.status} />
        </div>

        {/* Task Title & Scope */}
        <div className="mt-4">
          <Link
            to={`/app/mentoring/tasks/${task.id}`}
            className="block text-lg font-black text-plum-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400 break-words line-clamp-2"
          >
            {task.taskTitle}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8] break-words">
            {task.taskScope}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-plum-400 dark:text-[#8f9399]">Tiến độ công việc</span>
            <span className="font-extrabold text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-plum-900/[0.08] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-brand-500 to-mint-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-plum-400 dark:text-[#8f9399]">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {task.totalWorkLogs ?? 0} nhật ký ({task.pendingWorkLogs ?? 0} chờ duyệt)
            </span>
            <span>
              {task.workingMode} • {task.participationType}
            </span>
          </div>
        </div>

        {/* Participants (Student & Mentor) */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-plum-900/[0.06] pt-3.5 dark:border-white/[0.06]">
          {/* Student */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={task.studentAvatar || undefined}
              name={task.studentName || 'Học viên'}
              className="h-8 w-8 shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
                Học viên
              </span>
              <p className="truncate text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
                {task.studentName || 'Học viên'}
              </p>
            </div>
          </div>

          {/* Mentor */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={task.mentorAvatar || undefined}
              name={task.mentorName || 'Mentor'}
              className="h-8 w-8 shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
                Mentor
              </span>
              <p className="truncate text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
                {task.mentorName || 'Mentor'}
              </p>
            </div>
          </div>
        </div>

        {/* Price & Deadline Metadata */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-plum-900/[0.06] pt-3 text-xs dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 font-black text-brand-700 dark:text-brand-300">
            <DollarSign className="h-3.5 w-3.5" />
            <span>{formatPrice(task.agreedPrice)}</span>
            <span className="rounded-md bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-700 dark:bg-mint-950/40 dark:text-mint-300">
              Đã thanh toán
            </span>
          </div>

          <div
            className={cn(
              'flex items-center gap-1 font-semibold',
              isOverdue
                ? 'text-coral-600 dark:text-coral-400 font-bold'
                : 'text-plum-500 dark:text-[#8f9399]'
            )}
          >
            {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            <span>Hạn: {formatDeadline(task.deadline)}</span>
            {!isOverdue && daysRemaining >= 0 && (
              <span className="rounded-md bg-plum-900/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-plum-600 dark:bg-white/10 dark:text-[#e4e6eb]">
                Còn {daysRemaining} ngày
              </span>
            )}
            {isOverdue && (
              <span className="rounded-md bg-coral-100 px-1.5 py-0.5 text-[10px] font-bold text-coral-700">
                Quá hạn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-plum-900/[0.06] pt-4 dark:border-white/[0.06]">
        {task.conversationId ? (
          <Link
            to={`/app/mentoring/chats/${task.conversationId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-plum-900/[0.08] px-3 py-2 text-xs font-bold text-plum-600 transition-colors hover:bg-plum-900/[0.04] hover:text-plum-900 dark:border-white/10 dark:text-[#b0b3b8] dark:hover:bg-white/5 dark:hover:text-white"
          >
            <MessageSquare className="h-3.5 w-3.5 text-brand-600" />
            <span>Chat for Task</span>
          </Link>
        ) : (
          <div />
        )}

        <Link
          to={`/app/mentoring/tasks/${task.id}`}
          onClick={(e) => {
            if (onSelect) {
              e.preventDefault()
              onSelect(task.id)
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-brand-600 hover:shadow-md"
        >
          <span>Chi tiết Task</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
