import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'

/** Per-page enter/exit transition (used with <AnimatePresence> at the router). */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: TRANSITION.exit }}
      transition={TRANSITION.page}
    >
      {children}
    </motion.div>
  )
}
