import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

/** AlumNect wordmark + brand glyph. */
export function Logo({ className, to = '/', compact }: { className?: string; to?: string; compact?: boolean }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)} aria-label={BRAND.name}>
      <span className="relative grid place-items-center transition-transform duration-300 group-hover:scale-105">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/11/FPT_logo_2010.svg" alt="FPT" className="h-8" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-[#004F9E]">
          Alum<span className="text-[#F27024]">Nect</span>
        </span>
      )}
    </Link>
  )
}
