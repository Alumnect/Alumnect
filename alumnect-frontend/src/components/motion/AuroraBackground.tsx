import { cn } from '@/lib/utils'

/** Soft pastel aurora / blob backdrop for hero and section backgrounds. */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-brand-300/45 blur-[120px] animate-aurora" />
      <div
        className="absolute right-[-8rem] top-10 h-[30rem] w-[30rem] rounded-full bg-coral-300/40 blur-[120px] animate-aurora"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-mint-300/40 blur-[120px] animate-aurora"
        style={{ animationDelay: '-10s' }}
      />
      <div
        className="absolute right-1/4 bottom-0 h-[20rem] w-[20rem] rounded-full bg-violet-300/40 blur-[110px] animate-aurora"
        style={{ animationDelay: '-3s' }}
      />
    </div>
  )
}

const PASTELS = ['bg-brand-300/50', 'bg-coral-300/50', 'bg-mint-300/50', 'bg-violet-300/50', 'bg-sky-300/50', 'bg-gold-300/50']

/** Soft drifting pastel bokeh particles (light-friendly replacement for a starfield). */
export function Starfield({ count = 18 }: { count?: number }) {
  const dots = Array.from({ length: count }, (_, i) => {
    const rnd = ((i * 9301 + 49297) % 233280) / 233280
    const rnd2 = ((i * 4099 + 7919) % 233280) / 233280
    const rnd3 = ((i * 6151 + 1033) % 233280) / 233280
    return {
      left: `${(rnd * 100).toFixed(2)}%`,
      top: `${(rnd2 * 100).toFixed(2)}%`,
      delay: `${(rnd3 * 5).toFixed(2)}s`,
      dur: `${(5 + rnd2 * 6).toFixed(2)}s`,
      size: 8 + Math.round(rnd3 * 26),
      color: PASTELS[i % PASTELS.length],
    }
  })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className={cn('absolute rounded-full blur-[2px] animate-bob', d.color)}
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.dur }}
        />
      ))}
    </div>
  )
}
