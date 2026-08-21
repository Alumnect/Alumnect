import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'
import fptUniversityLogo from '@/assets/fpt-university-logo.png'

/** AlumNect wordmark + brand glyph. */
export function Logo({ className, to = '/', compact }: { className?: string; to?: string; compact?: boolean }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)} aria-label={BRAND.name}>
      <span className="relative flex items-center transition-transform duration-300 group-hover:scale-105">
        <img src={fptUniversityLogo} alt="FPT University Logo" className="h-7 sm:h-8 w-auto object-contain" />
      </span>
      {!compact && (
        <span className="hidden xl:inline-block ml-1 text-2xl font-bold tracking-normal leading-none" style={{ fontFamily: "'Caveat', 'Dancing Script', cursive" }}>
          <span className="text-[#004F9E]">Alum</span>
          <span className="text-[#F27024]">Nect</span>
        </span>
      )}
    </Link>
  )
}
