import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE_OUT } from '@/lib/motion'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 20 },
  down: { x: 0, y: -20 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
}

type RevealProps = {
  children: ReactNode
  className?: string
  direction?: Direction
  delay?: number
  duration?: number
  once?: boolean
  blur?: boolean
}

/** Scroll-triggered fade + slide reveal. The most-used entrance animation. */
export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  once = true,
  blur = false,
}: RevealProps) {
  const reduce = useReducedMotion()
  const { x, y } = offset[direction]

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={blur ? { opacity: 0, x, y, filter: 'blur(6px)' } : { opacity: 0, x, y }}
      whileInView={blur ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '0px' }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  gap?: number
  once?: boolean
}

/** Container that staggers the entrance of its <Reveal>-like children. */
export function Stagger({ children, className, gap = 0.06 }: StaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** A child item for <Stagger>. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  )
}
