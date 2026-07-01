import { useState } from 'react'
import { motion } from 'framer-motion'
import { compact } from '@/lib/utils'
import { MAP_MARKERS } from '@/lib/constants'

/**
 * Stylised dotted world map with pulsing alumni markers.
 * Lightweight (no map library) — perfect for previews and the Alumni Map page.
 */
export function WorldMap({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className={className}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-ink-850 to-ink-950 ring-1 ring-inset ring-plum-900/10">
        {/* dotted grid as a faux landmass texture */}
        <div className="absolute inset-0 bg-dots opacity-30 mask-radial" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-700/10 via-transparent to-violet-700/10" />

        {/* connection lines between major hubs */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {MAP_MARKERS.slice(0, 4).map((m, i) => {
            const next = MAP_MARKERS[(i + 1) % 4]
            return (
              <motion.line
                key={m.id}
                x1={`${m.x}%`}
                y1={`${m.y}%`}
                x2={`${next.x}%`}
                y2={`${next.y}%`}
                stroke="url(#mapline)"
                strokeWidth="1"
                strokeDasharray="4 6"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.6 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: i * 0.2 }}
              />
            )
          })}
          <defs>
            <linearGradient id="mapline" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>

        {/* markers */}
        {MAP_MARKERS.map((m, i) => (
          <button
            key={m.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            onMouseEnter={() => setActive(m.id)}
            onMouseLeave={() => setActive(null)}
            aria-label={`${m.city}: ${m.count} alumni`}
          >
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 320, damping: 18 }}
              className="relative block"
            >
              <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-brand-400/30" />
              <span
                className="block rounded-full bg-gradient-to-br from-brand-400 to-violet-500 ring-2 ring-plum-900/70"
                style={{ width: 8 + Math.min(14, m.count / 900), height: 8 + Math.min(14, m.count / 900) }}
              />
            </motion.span>

            {active === m.id && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg glass-strong px-3 py-1.5 text-xs font-semibold text-plum-900 shadow-glow"
              >
                {m.city} · {compact(m.count)} alumni
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
