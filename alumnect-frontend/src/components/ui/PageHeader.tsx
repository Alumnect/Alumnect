import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Consistent page title block for app & admin screens. */
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.content}
      className={cn('mb-7 flex flex-wrap items-end justify-between gap-4', className)}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-600/30 to-violet-600/20 text-brand-600 ring-1 ring-inset ring-plum-900/10">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-plum-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-plum-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  )
}
