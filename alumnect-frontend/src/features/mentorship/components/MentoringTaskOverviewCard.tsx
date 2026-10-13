import { DollarSign, Clock, AlertTriangle, Briefcase, Laptop } from 'lucide-react'
import { MentoringTaskBadge, MentoringTaskStageBadge } from './MentoringTaskBadge'
import type { MentoringTaskOverview } from '../model/mentoringTaskTypes'

interface MentoringTaskOverviewCardProps {
  overview?: MentoringTaskOverview | null
}

export function MentoringTaskOverviewCard({ overview }: MentoringTaskOverviewCardProps) {
  if (!overview) return null

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.06] pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="rounded-xl bg-plum-900/[0.06] px-3 py-1 font-mono text-xs font-black text-plum-700 dark:bg-white/10 dark:text-[#e4e6eb]">
            #TASK-{overview.id}
          </span>
          <MentoringTaskStageBadge stage={overview.uiStage} />
        </div>
        <MentoringTaskBadge status={overview.status} />
      </div>

      <div className="mt-5">
        <h3 className="text-xl font-black text-plum-900 dark:text-white break-words">
          {overview.taskTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-plum-600 dark:text-[#b0b3b8] break-words">
          {overview.taskScope}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-plum-400 dark:text-[#8f9399]">
            <DollarSign className="h-3.5 w-3.5 text-brand-500" />
            Chi phí thỏa thuận
          </span>
          <p className="mt-1 text-sm font-black text-brand-700 dark:text-brand-300">
            {formatPrice(overview.agreedPrice)}
          </p>
        </div>

        <div className="rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-plum-400 dark:text-[#8f9399]">
            <Laptop className="h-3.5 w-3.5 text-violet-500" />
            Hình thức làm việc
          </span>
          <p className="mt-1 text-sm font-bold text-plum-800 dark:text-[#e4e6eb]">
            {overview.workingMode} ({overview.participationType})
          </p>
        </div>

        <div className="rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-plum-400 dark:text-[#8f9399]">
            <Briefcase className="h-3.5 w-3.5 text-mint-500" />
            Loại nhiệm vụ
          </span>
          <p className="mt-1 text-sm font-bold text-plum-800 dark:text-[#e4e6eb] truncate">
            {overview.taskType}
          </p>
        </div>

        <div className="rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-plum-400 dark:text-[#8f9399]">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Thời hạn hoàn thành
          </span>
          <p className={`mt-1 text-sm font-bold ${overview.isOverdue ? 'text-coral-600 dark:text-coral-400 font-black' : 'text-plum-800 dark:text-[#e4e6eb]'}`}>
            {formatDate(overview.deadline)}
          </p>
        </div>
      </div>

      {overview.isOverdue && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-coral-50 p-3 text-xs font-bold text-coral-700 ring-1 ring-coral-400/30 dark:bg-coral-950/40 dark:text-coral-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-coral-600" />
          <span>
            Nhiệm vụ này đã quá hạn hoàn thành ({Math.abs(overview.daysRemaining)} ngày). Vui lòng trao đổi với đối phương qua Chat for Task để cập nhật tiến độ.
          </span>
        </div>
      )}
    </div>
  )
}
