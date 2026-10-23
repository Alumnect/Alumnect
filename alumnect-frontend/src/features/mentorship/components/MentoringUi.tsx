import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/**
 * Thành phần giao diện dùng chung của module Mentoring.
 * Màu sắc lấy theo bảng màu AlumNect: brand (thao tác chính), violet (xanh FPT – thông tin),
 * mint (thành công), coral (nguy hiểm), gold/amber (cần chú ý), plum/cream (trung tính).
 */
export type MentoringTone = 'brand' | 'navy' | 'mint' | 'coral' | 'gold' | 'neutral'

const TONES: Record<MentoringTone, { card: string; icon: string; badge: string; strip: string }> = {
  brand: {
    card: 'border-primary-soft-border bg-brand-50/70 dark:bg-brand-700/10',
    icon: 'bg-primary-solid text-on-primary',
    badge: 'bg-primary-soft text-primary-solid',
    strip: 'border-brand-200/70 bg-brand-50/70 text-primary-solid dark:border-brand-700/30 dark:bg-brand-700/10',
  },
  navy: {
    card: 'border-info bg-info-soft',
    icon: 'bg-info text-text-inverse',
    badge: 'bg-info-soft text-info',
    strip: 'border-info bg-info-soft text-info',
  },
  mint: {
    card: 'border-success-border bg-success-soft',
    icon: 'bg-success text-text-inverse',
    badge: 'bg-success-soft text-success',
    strip: 'border-success-border bg-success-soft text-success',
  },
  coral: {
    card: 'border-danger-border bg-danger-soft',
    icon: 'bg-danger text-text-inverse',
    badge: 'bg-danger-soft text-danger',
    strip: 'border-danger-border bg-danger-soft text-danger',
  },
  gold: {
    card: 'border-warning-border bg-warning-soft',
    icon: 'bg-warning text-text-inverse',
    badge: 'bg-warning-soft text-warning',
    strip: 'border-warning-border bg-warning-soft text-warning',
  },
  neutral: {
    card: 'border-border bg-surface-2 dark:bg-white/[0.03]',
    icon: 'bg-plum-700 text-white dark:bg-white/15',
    badge: 'bg-surface-3 text-text-muted',
    strip: 'border-border bg-surface-2 text-text-muted dark:bg-white/[0.04]',
  },
}

/** Huy hiệu trạng thái nhỏ, cùng một kiểu cho toàn module (yêu cầu, thỏa thuận, Task...). */
export function MentoringBadge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: MentoringTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none [&>svg]:h-3.5 [&>svg]:w-3.5',
        TONES[tone].badge,
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** Thẻ một việc cần xử lý: biểu tượng, tiêu đề, nội dung ngắn và các nút thao tác bên phải. */
export function MentoringActionCard({
  tone = 'neutral',
  icon,
  title,
  badge,
  children,
  actions,
}: {
  tone?: MentoringTone
  icon: ReactNode
  title: ReactNode
  badge?: ReactNode
  children?: ReactNode
  actions?: ReactNode
}) {
  const t = TONES[tone]
  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center sm:justify-between', t.card)}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl [&>svg]:h-4.5 [&>svg]:w-4.5', t.icon)}>{icon}</span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold text-text">{title}</p>
            {badge && <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', t.badge)}>{badge}</span>}
          </div>
          {children && <div className="space-y-1 text-xs leading-relaxed text-text-muted">{children}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  )
}

/** Dải trạng thái một dòng ngay dưới tiêu đề (trạng thái Deal / Task / chỉ đọc). */
export function MentoringStatusStrip({
  tone = 'neutral',
  icon,
  children,
  action,
  className,
}: {
  tone?: MentoringTone
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-xs font-semibold sm:px-6', TONES[tone].strip, className)}>
      <span className="flex min-w-0 items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0">
        {icon}
        <span className="min-w-0">{children}</span>
      </span>
      {action}
    </div>
  )
}

type ActionIntent = 'primary' | 'secondary' | 'danger' | 'ghost'

const INTENT_CLASS: Record<ActionIntent, string> = {
  primary: '',
  secondary: '',
  danger:
    'border border-danger-border bg-surface text-danger hover:border-danger hover:bg-danger-soft hover:text-danger dark:bg-transparent',
  ghost: '',
}

/** Nút thao tác thống nhất trong module Mentoring (dựa trên Button của hệ thống). */
export function MentoringActionButton({
  intent = 'secondary',
  icon,
  loading,
  disabled,
  onClick,
  children,
  title,
}: {
  intent?: ActionIntent
  icon?: ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
  title?: string
}) {
  const variant = intent === 'primary' ? 'primary' : intent === 'ghost' ? 'ghost' : intent === 'danger' ? 'ghost' : 'outline'
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      leftIcon={loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      className={cn('h-8 rounded-lg px-3 text-xs', INTENT_CLASS[intent])}
    >
      {children}
    </Button>
  )
}


/** Nhãn + gợi ý + ô nhập của một trường trong form Mentoring. */
export function MentoringField({
  label,
  hint,
  required,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-text">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-text-subtle">{hint}</span>}
    </label>
  )
}

export interface MentoringFilterOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

/** Thanh lọc dạng tab (segmented) dùng chung cho các danh sách Mentoring. */
export function MentoringFilterTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: MentoringFilterOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-cream-200/70 p-1 [scrollbar-width:none] dark:bg-white/[0.06]"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5',
              active
                ? 'bg-surface text-primary-solid shadow-xs'
                : 'text-text-muted hover:text-text',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Ô số liệu có liên kết: nhãn, giá trị nổi bật và một dòng gợi ý. */
export function MentoringStatTile({
  to,
  tone = 'neutral',
  icon,
  label,
  value,
  hint,
  loading,
}: {
  to: string
  tone?: MentoringTone
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: ReactNode
  loading?: boolean
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs transition hover:border-brand-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:border-brand-500/40"
    >
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5', TONES[tone].badge)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-text-subtle">{label}</span>
        {loading ? (
          <span className="mt-1 block h-5 w-16 animate-pulse rounded bg-surface-3" />
        ) : (
          <span className="block font-display text-lg font-bold leading-tight text-text">{value}</span>
        )}
        {hint && <span className="mt-0.5 block truncate text-xs text-text-subtle">{hint}</span>}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-plum-300 transition group-hover:translate-x-0.5 group-hover:text-primary-solid" />
    </Link>
  )
}

/** Thông báo lỗi trong form. */
export function MentoringFormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-danger-border bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
      {message}
    </div>
  )
}
