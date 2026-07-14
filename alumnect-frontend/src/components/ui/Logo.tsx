import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

/** AlumNect wordmark + brand glyph. */
export function Logo({ className, to = '/', compact }: { className?: string; to?: string; compact?: boolean }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)} aria-label={BRAND.name}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.8)] transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
          <path d="M16 6 L25 26 L20.5 26 L18.5 21.5 L13.5 21.5 L11.5 26 L7 26 Z" fill="white" />
          <path d="M14.7 18 L17.3 18 L16 14.4 Z" fill="#5b6bff" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-ink-900" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-plum-900">
          Alum<span className="text-gradient">Nect</span>
        </span>
      )}
    </Link>
  )
}
