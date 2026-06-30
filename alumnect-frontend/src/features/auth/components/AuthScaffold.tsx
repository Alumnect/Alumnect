import { forwardRef } from 'react'
import type { ReactNode, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { Starfield } from '@/components/motion'
import { STATS } from '@/lib/constants'

/** Two-column auth scaffold: warm pastel brand showcase + light form panel. */
export function AuthScaffold({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---- Showcase ---- */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400 via-violet-400 to-coral-400" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
        <Starfield count={16} />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="rounded-2xl bg-white/70 px-4 py-2.5 backdrop-blur-md ring-1 ring-white/60 w-fit">
            <Logo />
          </div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-md text-balance text-4xl font-extrabold leading-tight text-white drop-shadow-sm"
            >
              Welcome to the verified home of the FPTU alumni family.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 max-w-md rounded-3xl glass-strong p-6"
            >
              <Quote className="text-violet-500" size={24} />
              <p className="mt-2 text-sm leading-relaxed text-plum-700">
                “The verified badge changes everything. You know you're talking to real graduates.”
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img src="https://i.pravatar.cc/80?img=33" alt="" className="h-10 w-10 rounded-full" />
                <div>
                  <p className="flex items-center gap-1 text-sm font-bold text-plum-900">
                    Nguyễn Hải Long <BadgeCheck size={14} className="text-brand-500" />
                  </p>
                  <p className="text-xs text-plum-500">Product Manager · IB K13</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {STATS.slice(0, 3).map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/60 p-3 backdrop-blur-md ring-1 ring-white/60">
                <p className="text-2xl font-extrabold text-plum-900">
                  {s.value > 999 ? `${(s.value / 1000).toFixed(1)}k` : s.value}
                  {s.suffix}
                </p>
                <p className="text-xs text-plum-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Form panel ---- */}
      <div className="relative flex items-center justify-center bg-cream-50 px-5 py-12 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.05]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  trailing?: ReactNode
  error?: string
}

/** Styled text field for auth forms — RHF-ready (forwards ref, shows error). */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, trailing, error, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-plum-700">{label}</span>
      <span className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3.5 text-plum-400">{icon}</span>}
        <input
          ref={ref}
          {...rest}
          className={cn(
            'h-12 w-full rounded-xl border border-plum-900/10 bg-cream-100 px-4 text-sm text-plum-900 placeholder:text-plum-400 transition-colors focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25',
            icon && 'pl-10',
            trailing && 'pr-11',
            error && 'border-coral-400 focus:border-coral-400 focus:ring-coral-400/30',
            className,
          )}
        />
        {trailing && <span className="absolute right-3">{trailing}</span>}
      </span>
      {error && <span className="mt-1 block text-xs font-medium text-coral-600">{error}</span>}
    </label>
  )
})
