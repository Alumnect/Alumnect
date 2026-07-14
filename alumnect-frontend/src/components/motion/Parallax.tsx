import { useRef } from 'react'
import type { ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

type ParallaxProps = {
  children: ReactNode
  className?: string
  /** Travel distance in px across the scroll window. Negative = moves up faster. */
  speed?: number
  axis?: 'y' | 'x'
}

/** Scroll-linked parallax translate for any content. */
export function Parallax({ children, className, speed = -80, axis = 'y' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const move = useTransform(scrollYProgress, [0, 1], [speed * -1, speed])

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : axis === 'y' ? { y: move } : { x: move }}>
        {children}
      </motion.div>
    </div>
  )
}

type ParallaxLayerProps = {
  children?: ReactNode
  className?: string
  depth?: number
}

/** A free-floating decorative layer that drifts on scroll (for hero backgrounds). */
export function ParallaxLayer({ children, className, depth = 1 }: ParallaxLayerProps) {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, depth * 320])

  return (
    <motion.div className={className} style={reduce ? undefined : { y }} aria-hidden>
      {children}
    </motion.div>
  )
}
