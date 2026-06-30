import type { ReactNode, HTMLAttributes } from 'react'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

/** Max-width responsive content container. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

type BadgeTone = 'brand' | 'gold' | 'aqua' | 'violet' | 'neutral' | 'success' | 'danger'

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-100 text-brand-700 ring-brand-300/60',
  gold: 'bg-gold-300/45 text-gold-600 ring-gold-400/60',
  aqua: 'bg-aqua-400/15 text-aqua-500 ring-aqua-400/40',
  violet: 'bg-violet-200/55 text-violet-600 ring-violet-300/70',
  neutral: 'bg-plum-900/[0.05] text-plum-600 ring-plum-900/10',
  success: 'bg-mint-300/45 text-emerald-600 ring-mint-400/60',
  danger: 'bg-coral-300/45 text-rose-500 ring-coral-400/60',
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

/** Eyebrow + title + subtitle block used at the top of marketing sections. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' ? 'mx-auto text-center' : 'text-left', className)}>
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-700 ring-1 ring-inset ring-brand-300/50">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-[2.7rem]">{title}</h2>
      {subtitle && <p className="mt-4 text-pretty text-base leading-relaxed text-plum-500 sm:text-lg">{subtitle}</p>}
    </div>
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
  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          className={cn(
            'h-full w-full rounded-full object-cover',
            ring && 'ring-2 ring-brand-300 ring-offset-2 ring-offset-cream-50',
          )}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-violet-400 text-xs font-bold text-white"
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
