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
    <div className={cn('rounded-3xl border border-border bg-surface p-5 shadow-xs', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Tiến trình Mentoring Task
          </span>
          <h4 className="text-base font-bold text-text">
            {STAGES[currentIndex].title}
          </h4>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="h-2 w-28 sm:w-36 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-brand-500 via-violet-500 to-mint-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-bold text-text-muted min-w-[36px] text-right">
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
                'relative flex items-center gap-3.5 rounded-2xl p-3.5 transition duration-200 border',
                isCurrent
                  ? 'border-primary-soft-border bg-brand-50/70 shadow-xs dark:bg-brand-500/10'
                  : isPassed
                  ? 'border-success bg-success-soft'
                  : 'border-border bg-cream-100/70 opacity-80 dark:bg-bg'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-transform',
                  isCurrent
                    ? 'bg-primary-solid text-on-primary shadow-md shadow-brand-500/25 scale-105'
                    : isPassed
                    ? 'bg-success text-text-inverse'
                    : 'bg-surface-3 text-text-subtle'
                )}
              >
                {isPassed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">
                    Giai đoạn {idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-solid animate-pulse" />
                  )}
                </div>
                <p
                  className={cn(
                    'truncate text-sm font-bold',
                    isCurrent
                      ? 'text-primary-solid font-bold'
                      : isPassed
                      ? 'text-success'
                      : 'text-text-muted'
                  )}
                >
                  {stage.title}
                </p>
                <p className="truncate text-xs text-text-subtle">
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
