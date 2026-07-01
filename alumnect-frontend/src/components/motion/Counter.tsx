import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type CounterProps = {
  value: number
  className?: string
  suffix?: string
  prefix?: string
  duration?: number
  compactFmt?: boolean
}

/** Number that counts up from 0 when it scrolls into view. */
export function Counter({ value, className, suffix = '', prefix = '', duration = 1.8, compactFmt }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration, reduce])

  const formatted = compactFmt
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(display))
    : Math.round(display).toLocaleString('en-US')

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
