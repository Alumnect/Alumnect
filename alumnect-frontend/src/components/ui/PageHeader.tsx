import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Khối tiêu đề trang cho màn app & admin: tên trang luôn nhìn thấy (người dùng biết mình đang ở đâu),
 * kèm một dòng mô tả ngắn và các nút hành động bên phải (Tạo bài, Đặt câu hỏi…).
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2', className)}>
      <div className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-3">
        {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-solid">{icon}</span>}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-text sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm leading-snug text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
