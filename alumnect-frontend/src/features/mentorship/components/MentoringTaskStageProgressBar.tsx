import { Check, Clock, PlayCircle, Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { MentoringTaskUIStage } from '../model/mentoringTaskTypes'

interface MentoringTaskStageProgressBarProps {
  currentStage: MentoringTaskUIStage
  progressPercentage: number
  className?: string
}

const STAGES = [
  {
    key: 'PREPARATION' as MentoringTaskUIStage,
    title: 'Chuẩn bị',
    subtitle: 'Kích hoạt & chuẩn bị',
    icon: Clock,
  },
  {
    key: 'IN_PROGRESS' as MentoringTaskUIStage,
    title: 'Đang thực hiện',
    subtitle: 'Ghi nhận Work Logs',
    icon: PlayCircle,
  },
  {
    key: 'ENDING' as MentoringTaskUIStage,
    title: 'Kết thúc & Nghiệm thu',
    subtitle: 'Bàn giao & thanh toán',
    icon: Flag,
  },
]

export function MentoringTaskStageProgressBar({
  currentStage,
  progressPercentage,
  className = '',
}: MentoringTaskStageProgressBarProps) {
  const getStageIndex = (stage: MentoringTaskUIStage) => {
    switch (stage) {
      case 'PREPARATION':
        return 0
      case 'IN_PROGRESS':
        return 1
      case 'ENDING':
        return 2
      default:
        return 0
    }
  }

  const currentIndex = getStageIndex(currentStage)

  return (
    <div className={cn('rounded-3xl border border-plum-900/[0.08] bg-white p-5 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            Tiến trình Mentoring Task
          </span>
          <h4 className="text-base font-black text-plum-900 dark:text-white">
            {STAGES[currentIndex].title}
          </h4>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="h-2 w-28 sm:w-36 overflow-hidden rounded-full bg-plum-900/[0.08] dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-brand-500 via-violet-500 to-mint-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-black text-plum-700 dark:text-[#e4e6eb] min-w-[36px] text-right">
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex
          const isCurrent = idx === currentIndex
          const Icon = stage.icon

          return (
            <div
              key={stage.key}
              className={cn(
                'relative flex items-center gap-3.5 rounded-2xl p-3.5 transition-all duration-200 border',
                isCurrent
                  ? 'border-brand-500/30 bg-brand-50/70 shadow-xs dark:border-brand-500/40 dark:bg-brand-500/10'
                  : isPassed
                  ? 'border-mint-500/25 bg-mint-50/50 dark:border-mint-500/30 dark:bg-mint-500/10'
                  : 'border-plum-900/[0.05] bg-plum-900/[0.02] opacity-75 dark:border-white/5 dark:bg-white/[0.02]'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-transform',
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-105'
                    : isPassed
                    ? 'bg-mint-600 text-white'
                    : 'bg-plum-900/10 text-plum-500 dark:bg-white/10 dark:text-[#b0b3b8]'
                )}
              >
                {isPassed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
                    Giai đoạn {idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                  )}
                </div>
                <p
                  className={cn(
                    'truncate text-sm font-bold',
                    isCurrent
                      ? 'text-brand-900 dark:text-brand-200 font-extrabold'
                      : isPassed
                      ? 'text-mint-900 dark:text-mint-200'
                      : 'text-plum-600 dark:text-[#b0b3b8]'
                  )}
                >
                  {stage.title}
                </p>
                <p className="truncate text-xs text-plum-400 dark:text-[#8f9399]">
                  {stage.subtitle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
