import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MarqueeProps = {
  children: ReactNode
  className?: string
  reverse?: boolean
  /** seconds per loop */
  speed?: number
  pauseOnHover?: boolean
}

/** Seamless infinite horizontal marquee (duplicates content for a perfect loop). */
export function Marquee({ children, className, reverse = false, speed = 38, pauseOnHover = true }: MarqueeProps) {
  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div
        className={cn(
          'flex min-w-full shrink-0 items-center gap-6',
          reverse ? 'animate-marquee-rev' : 'animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          'flex min-w-full shrink-0 items-center gap-6',
          reverse ? 'animate-marquee-rev' : 'animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  )
}
