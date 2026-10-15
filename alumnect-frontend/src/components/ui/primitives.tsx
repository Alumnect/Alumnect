import { useState } from 'react'
import type { ReactNode, HTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn, initials } from '@/lib/utils'


/** Max-width responsive content container. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

export type BadgeTone = 'brand' | 'gold' | 'aqua' | 'violet' | 'neutral' | 'success' | 'danger' | 'mint' | 'rose'

const TONE_BRAND = 'bg-primary-soft text-primary-solid ring-primary-soft-border'
const TONE_INFO = 'bg-info-soft text-info ring-info-border'
const TONE_SUCCESS = 'bg-success-soft text-success ring-success-border'
const TONE_WARNING = 'bg-warning-soft text-warning ring-warning-border'
const TONE_DANGER = 'bg-danger-soft text-danger ring-danger-border'
const TONE_NEUTRAL = 'bg-surface-2 text-text-muted ring-border'

/** Các tone cũ là alias của 6 tone chuẩn: brand, info, success, warning, danger, neutral. */
const BADGE_TONES: Record<BadgeTone, string> = {
  brand: TONE_BRAND,
  gold: TONE_WARNING,
  aqua: TONE_INFO,
  violet: TONE_BRAND,
  neutral: TONE_NEUTRAL,
  success: TONE_SUCCESS,
  danger: TONE_DANGER,
  mint: TONE_SUCCESS,
  rose: TONE_DANGER,
}

export function Badge({
  children,
  tone = 'brand',
  className,
  icon,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  icon?: ReactNode
  size?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** Pillowy surface card. */
export function Card({
  className,
  children,
  glass,
  hover = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { glass?: boolean; hover?: boolean }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-surface border border-border text-text shadow-raised',
        glass && 'glass',
        hover && 'hover-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Avatar with optional image, verified ring and badge. */
export function Avatar({
  src,
  name,
  size = 44,
  className,
  ring,
}: {
  src?: string
  name: string
  size?: number
  verified?: boolean
  className?: string
  ring?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={cn('relative inline-flex shrink-0 rounded-full', className)} style={{ width: size, height: size }}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full rounded-full object-cover',
            ring && 'ring-2 ring-primary ring-offset-2 ring-offset-bg',
          )}
        />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-primary-solid font-bold text-on-primary',
            ring && 'ring-2 ring-primary ring-offset-2 ring-offset-bg',
          )}
          style={{ fontSize: Math.max(11, size * 0.36) }}
          aria-hidden
        >
          {initials(name)}
        </span>
      )}
    </span>
  )
}


/** Loading skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />
}

/** Friendly empty state for zero-result lists. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center', className)}>
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary-solid">
        {icon ?? <Search size={24} />}
      </span>
      <h3 className="text-lg font-bold text-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
