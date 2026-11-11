import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  kicker?: ReactNode
  kickerIcon?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}

/**
 * Khối tiêu đề chuẩn cho toàn bộ các trang Quản trị & Ứng dụng.
 * Chuẩn hóa 100% theo giao diện Quản lý Cố vấn & Gói dịch vụ:
 * - Kicker: text-xs font-bold uppercase tracking-wider text-primary-solid kèm icon size 15
 * - Title: mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white
 * - Subtitle: mt-0.5 text-xs text-text-subtle
 */
export function PageHeader({
  title,
  subtitle,
  kicker,
  kickerIcon,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        {(kicker || kickerIcon) && (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-solid">
            {kickerIcon}
            <span>{kicker}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          {icon && !kicker && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-solid">
              {icon}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-subtle">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
