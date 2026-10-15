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
    card: 'border-brand-200 bg-brand-50/70 dark:border-brand-700/30 dark:bg-brand-700/10',
    icon: 'bg-brand-600 text-white',
    badge: 'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-200',
    strip: 'border-brand-200/70 bg-brand-50/70 text-brand-700 dark:border-brand-700/30 dark:bg-brand-700/10 dark:text-brand-200',
  },
  navy: {
    card: 'border-violet-500/20 bg-violet-500/5 dark:border-violet-400/20 dark:bg-violet-500/10',
    icon: 'bg-violet-500 text-white',
    badge: 'bg-violet-500/10 text-violet-500 dark:bg-violet-400/20 dark:text-violet-300',
    strip: 'border-violet-500/15 bg-violet-500/5 text-violet-500 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300',
  },
  mint: {
    card: 'border-mint-200 bg-mint-50 dark:border-mint-700/30 dark:bg-mint-900/20',
    icon: 'bg-mint-600 text-white',
    badge: 'bg-mint-100 text-mint-700 dark:bg-mint-900/40 dark:text-mint-300',
    strip: 'border-mint-200 bg-mint-50 text-mint-800 dark:border-mint-700/30 dark:bg-mint-900/20 dark:text-mint-300',
  },
  coral: {
    card: 'border-coral-200 bg-coral-50 dark:border-coral-700/30 dark:bg-coral-900/20',
    icon: 'bg-coral-600 text-white',
    badge: 'bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300',
    strip: 'border-coral-200 bg-coral-50 text-coral-700 dark:border-coral-700/30 dark:bg-coral-900/20 dark:text-coral-300',
  },
  gold: {
    card: 'border-amber-200 bg-amber-50 dark:border-amber-700/30 dark:bg-amber-900/20',
    icon: 'bg-gold-500 text-white',
    badge: 'bg-amber-100 text-gold-700 dark:bg-amber-900/40 dark:text-gold-300',
    strip: 'border-amber-200 bg-amber-50 text-gold-700 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-gold-300',
  },
  neutral: {
    card: 'border-cream-300 bg-cream-100 dark:border-white/10 dark:bg-white/[0.03]',
    icon: 'bg-plum-700 text-white dark:bg-white/15',
    badge: 'bg-cream-200 text-plum-700 dark:bg-white/10 dark:text-[#b0b3b8]',
    strip: 'border-cream-300 bg-cream-100 text-plum-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#b0b3b8]',
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
            <p className="font-display text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">{title}</p>
            {badge && <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', t.badge)}>{badge}</span>}
          </div>
          {children && <div className="space-y-1 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">{children}</div>}
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
}: {
  tone?: MentoringTone
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-xs font-semibold sm:px-6', TONES[tone].strip)}>
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
    'border border-coral-200 bg-white text-coral-600 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-700 dark:border-coral-700/40 dark:bg-transparent dark:text-coral-300 dark:hover:bg-coral-900/30',
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
      <span className="block text-sm font-semibold text-plum-800 dark:text-[#e4e6eb]">
        {label}
        {required && <span className="text-coral-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-plum-500 dark:text-plum-400">{hint}</span>}
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
                ? 'bg-white text-brand-700 shadow-xs dark:bg-[#3a3b3c] dark:text-white'
                : 'text-plum-600 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white',
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
      className="group flex items-center gap-3 rounded-2xl border border-plum-900/[0.08] bg-white p-4 shadow-xs transition hover:border-brand-500/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-white/10 dark:bg-[#242526] dark:hover:border-brand-500/40"
    >
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5', TONES[tone].badge)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-plum-500 dark:text-[#b0b3b8]">{label}</span>
        {loading ? (
          <span className="mt-1 block h-5 w-16 animate-pulse rounded bg-cream-200 dark:bg-white/10" />
        ) : (
          <span className="block font-display text-lg font-bold leading-tight text-plum-900 dark:text-white">{value}</span>
        )}
        {hint && <span className="mt-0.5 block truncate text-[11px] text-plum-500 dark:text-[#8f9399]">{hint}</span>}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-plum-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </Link>
  )
}

/** Thông báo lỗi trong form. */
export function MentoringFormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm text-coral-700 dark:border-coral-700/40 dark:bg-coral-900/20 dark:text-coral-300">
      {message}
    </div>
  )
}
