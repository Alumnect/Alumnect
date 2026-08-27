import { useState } from 'react'
import type { ReactNode, HTMLAttributes } from 'react'
import { BadgeCheck, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

/** Max-width responsive content container. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

type BadgeTone = 'brand' | 'gold' | 'aqua' | 'violet' | 'neutral' | 'success' | 'danger'

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-100 text-brand-700 ring-brand-300/60',
  gold: 'bg-gold-300/50 text-gold-700 ring-gold-400/60',
  aqua: 'bg-aqua-400/20 text-aqua-700 ring-aqua-500/40',
  violet: 'bg-violet-200/60 text-violet-600 ring-violet-300/70',
  neutral: 'bg-plum-900/[0.05] text-plum-600 ring-plum-900/10',
  success: 'bg-mint-300/50 text-mint-700 ring-mint-400/60',
  danger: 'bg-coral-300/50 text-coral-700 ring-coral-400/60',
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
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset',
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
        'group relative overflow-hidden rounded-3xl',
        glass ? 'glass' : 'card-surface',
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
  verified,
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
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full rounded-full object-cover',
            ring && 'ring-2 ring-brand-300 ring-offset-2 ring-offset-cream-50',
          )}
        />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-violet-400 font-bold text-white',
            ring && 'ring-2 ring-brand-300 ring-offset-2 ring-offset-cream-50',
          )}
          style={{ fontSize: Math.max(11, size * 0.36) }}
          aria-hidden
        >
          {initials(name)}
        </span>
      )}
      {verified && (
        <BadgeCheck
          className="absolute -bottom-1 -right-1 rounded-full bg-white text-brand-500"
          size={Math.max(14, size * 0.34)}
          strokeWidth={2.4}
        />
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
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed border-plum-900/15 bg-white/50 px-6 py-16 text-center', className)}>
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-600">
        {icon ?? <Search size={24} />}
      </span>
      <h3 className="text-lg font-bold text-plum-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-plum-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
