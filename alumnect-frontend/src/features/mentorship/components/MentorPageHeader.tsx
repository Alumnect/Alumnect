import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MentorPageHeaderProps {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * Header dùng chung cho toàn bộ không gian Mentoring.
 * Giữ cấu trúc ngắn, một điểm nhấn màu và một vùng hành động rõ ràng.
 */
export function MentorPageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  className,
}: MentorPageHeaderProps) {
  return (
    <header
      className={cn(
        'mentor-page-header flex flex-col gap-4 rounded-2xl border border-plum-900/[0.08] bg-white p-5 shadow-xs sm:p-6 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-[#242526]',
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
            {icon && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
                {icon}
              </span>
            )}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-plum-900 sm:text-3xl dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-plum-600 dark:text-[#c7c9cc]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {actions}
        </div>
      )}
    </header>
  )
}
