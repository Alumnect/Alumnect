import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/** Per-page enter/exit transition (used with <AnimatePresence> at the router). */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
